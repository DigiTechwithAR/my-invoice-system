/**
 * Invoice System API - Cloudflare Worker
 * REST API for GST-compliant invoicing apppplication
 */

// CORS Headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle preflight requests
function handleOptions(request) {
  return new Response(null, {
    headers: corsHeaders,
  });
}

// JSON response helper
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Error response helper
function errorResponse(message, status = 400) {
  return jsonResponse({ error: message }, status);
}

// Generate invoice number: INV-YYYY-NNNN
function generateInvoiceNumber(year, sequence) {
  const paddedSeq = String(sequence).padStart(4, '0');
  return `INV-${year}-${paddedSeq}`;
}

// Calculate GST based on state codes
function calculateGST(items, clientStateCode, businessStateCode = '27') {
  const isInterState = clientStateCode !== businessStateCode;

  let subtotal = 0;
  let totalGST = 0;

  const processedItems = items.map(item => {
    const amount = item.quantity * item.rate;
    const gstAmount = (amount * item.gstPercentage) / 100;
    subtotal += amount;
    totalGST += gstAmount;

    return {
      ...item,
      amount,
      gstAmount,
    };
  });

  let cgst = 0, sgst = 0, igst = 0;

  if (isInterState) {
    igst = totalGST;
  } else {
    cgst = totalGST / 2;
    sgst = totalGST / 2;
  }

  const total = subtotal + totalGST;

  return {
    items: processedItems,
    subtotal,
    cgst,
    sgst,
    igst,
    total,
    isInterState,
  };
}

// Auth middleware - extract user from request
async function getUserFromRequest(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const email = authHeader.replace('Bearer ', '');
  const decodedEmail = decodeURIComponent(email);

  try {
    const result = await env.DB.prepare(
      'SELECT id, email, business_name, business_address, business_phone, business_gst, business_pan, state_code FROM users WHERE email = ?'
    ).bind(decodedEmail).first();

    return result;
  } catch (e) {
    return null;
  }
}

// ============== ROUTE HANDLERS ==============

// Login endpoint
async function handleLogin(request, env) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return errorResponse('Email and password required', 400);
  }

  try {
    const user = await env.DB.prepare(
      'SELECT id, email, password_hash, business_name, state_code FROM users WHERE email = ?'
    ).bind(email).first();

    if (!user) {
      return errorResponse('Invalid credentials', 401);
    }

    // Simple password check (in production, use bcrypt)
    if (user.password_hash !== password) {
      return errorResponse('Invalid credentials', 401);
    }

    // Return user data without password
    const { password_hash, ...userData } = user;

    return jsonResponse({
      message: 'Login successful',
      user: userData,
      token: encodeURIComponent(email), // Simple token (email encoded)
    });
  } catch (e) {
    console.error('Login error:', e);
    return errorResponse('Internal server error', 500);
  }
}

// Get current user profile
async function handleGetProfile(request, env, user) {
  try {
    const fullProfile = await env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(user.id).first();

    if (!fullProfile) {
      return errorResponse('User not found', 404);
    }

    delete fullProfile.password_hash;

    return jsonResponse({ user: fullProfile });
  } catch (e) {
    console.error('Get profile error:', e);
    return errorResponse('Internal server error', 500);
  }
}

// Update user profile
async function handleUpdateProfile(request, env, user) {
  const data = await request.json();

  try {
    await env.DB.prepare(`
      UPDATE users
      SET business_name = ?, business_address = ?, business_phone = ?,
          business_gst = ?, business_pan = ?, state_code = ?
      WHERE id = ?
    `).bind(
      data.business_name || user.business_name,
      data.business_address || null,
      data.business_phone || null,
      data.business_gst || null,
      data.business_pan || null,
      data.state_code || user.state_code,
      user.id
    ).run();

    return jsonResponse({ message: 'Profile updated successfully' });
  } catch (e) {
    console.error('Update profile error:', e);
    return errorResponse('Internal server error', 500);
  }
}

// Get all clients
async function handleGetClients(request, env, user) {
  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM clients WHERE user_id = ? ORDER BY name ASC'
    ).bind(user.id).all();

    return jsonResponse({ clients: results || [] });
  } catch (e) {
    console.error('Get clients error:', e);
    return errorResponse('Internal server error', 500);
  }
}

// Get single client
async function handleGetClient(request, env, user, clientId) {
  try {
    const client = await env.DB.prepare(
      'SELECT * FROM clients WHERE id = ? AND user_id = ?'
    ).bind(clientId, user.id).first();

    if (!client) {
      return errorResponse('Client not found', 404);
    }

    return jsonResponse({ client });
  } catch (e) {
    console.error('Get client error:', e);
    return errorResponse('Internal server error', 500);
  }
}

// Create client
async function handleCreateClient(request, env, user) {
  const data = await request.json();

  if (!data.name) {
    return errorResponse('Client name is required', 400);
  }

  try {
    const result = await env.DB.prepare(`
      INSERT INTO clients (user_id, name, email, phone, address, gst_number, pan_number, state_code, state_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user.id,
      data.name,
      data.email || null,
      data.phone || null,
      data.address || null,
      data.gst_number || null,
      data.pan_number || null,
      data.state_code || '27',
      data.state_name || 'Maharashtra'
    ).run();

    const newClient = await env.DB.prepare(
      'SELECT * FROM clients WHERE id = ?'
    ).bind(result.meta.last_row_id).first();

    return jsonResponse({
      message: 'Client created successfully',
      client: newClient
    }, 201);
  } catch (e) {
    console.error('Create client error:', e);
    return errorResponse('Internal server error', 500);
  }
}

// Update client
async function handleUpdateClient(request, env, user, clientId) {
  const data = await request.json();

  try {
    await env.DB.prepare(`
      UPDATE clients
      SET name = ?, email = ?, phone = ?, address = ?,
          gst_number = ?, pan_number = ?, state_code = ?, state_name = ?
      WHERE id = ? AND user_id = ?
    `).bind(
      data.name || null,
      data.email || null,
      data.phone || null,
      data.address || null,
      data.gst_number || null,
      data.pan_number || null,
      data.state_code || '27',
      data.state_name || 'Maharashtra',
      clientId,
      user.id
    ).run();

    const updatedClient = await env.DB.prepare(
      'SELECT * FROM clients WHERE id = ?'
    ).bind(clientId).first();

    return jsonResponse({
      message: 'Client updated successfully',
      client: updatedClient
    });
  } catch (e) {
    console.error('Update client error:', e);
    return errorResponse('Internal server error', 500);
  }
}

// Delete client
async function handleDeleteClient(request, env, user, clientId) {
  try {
    const result = await env.DB.prepare(
      'DELETE FROM clients WHERE id = ? AND user_id = ?'
    ).bind(clientId, user.id).run();

    if (result.changes === 0) {
      return errorResponse('Client not found', 404);
    }

    return jsonResponse({ message: 'Client deleted successfully' });
  } catch (e) {
    console.error('Delete client error:', e);
    return errorResponse('Internal server error', 500);
  }
}

// Get dashboard stats
async function handleGetDashboard(request, env, user) {
  try {
    // Total revenue (paid invoices)
    const revenueResult = await env.DB.prepare(`
      SELECT COALESCE(SUM(amount_paid), 0) as total
      FROM invoices
      WHERE user_id = ? AND status = 'paid'
    `).bind(user.id).first();

    // Pending payments
    const pendingResult = await env.DB.prepare(`
      SELECT COALESCE(SUM(total_amount - amount_paid), 0) as total
      FROM invoices
      WHERE user_id = ? AND status IN ('unpaid', 'partial')
    `).bind(user.id).first();

    // Invoice counts by status
    const statusCounts = await env.DB.prepare(`
      SELECT status, COUNT(*) as count
      FROM invoices
      WHERE user_id = ?
      GROUP BY status
    `).bind(user.id).all();

    // Recent invoices
    const recentInvoices = await env.DB.prepare(`
      SELECT i.*, c.name as client_name, c.email as client_email
      FROM invoices i
      JOIN clients c ON i.client_id = c.id
      WHERE i.user_id = ?
      ORDER BY i.created_at DESC
      LIMIT 5
    `).bind(user.id).all();

    // Client count
    const clientCount = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM clients WHERE user_id = ?'
    ).bind(user.id).first();

    const counts = {};
    (statusCounts.results || []).forEach(s => {
      counts[s.status] = s.count;
    });

    return jsonResponse({
      stats: {
        totalRevenue: revenueResult.total || 0,
        pendingPayments: pendingResult.total || 0,
        paidInvoices: counts.paid || 0,
        unpaidInvoices: counts.unpaid || 0,
        partialInvoices: counts.partial || 0,
        totalClients: clientCount.count || 0,
      },
      recentInvoices: recentInvoices.results || [],
    });
  } catch (e) {
    console.error('Get dashboard error:', e);
    return errorResponse('Internal server error', 500);
  }
}

// Get all invoices
async function handleGetInvoices(request, env, user) {
  try {
    const { results } = await env.DB.prepare(`
      SELECT i.*, c.name as client_name, c.email as client_email, c.phone as client_phone
      FROM invoices i
      JOIN clients c ON i.client_id = c.id
      WHERE i.user_id = ?
      ORDER BY i.created_at DESC
    `).bind(user.id).all();

    return jsonResponse({ invoices: results || [] });
  } catch (e) {
    console.error('Get invoices error:', e);
    return errorResponse('Internal server error', 500);
  }
}

// Get single invoice with items
async function handleGetInvoice(request, env, user, invoiceId) {
  try {
    const invoice = await env.DB.prepare(`
      SELECT i.*, c.name as client_name, c.email as client_email,
             c.phone as client_phone, c.address as client_address,
             c.gst_number as client_gst, c.pan_number as client_pan,
             c.state_code as client_state_code, c.state_name as client_state_name
      FROM invoices i
      JOIN clients c ON i.client_id = c.id
      WHERE i.id = ? AND i.user_id = ?
    `).bind(invoiceId, user.id).first();

    if (!invoice) {
      return errorResponse('Invoice not found', 404);
    }

    const items = await env.DB.prepare(
      'SELECT * FROM invoice_items WHERE invoice_id = ?'
    ).bind(invoiceId).all();

    const payments = await env.DB.prepare(
      'SELECT * FROM payments WHERE invoice_id = ? ORDER BY payment_date DESC'
    ).bind(invoiceId).all();

    return jsonResponse({
      invoice: {
        ...invoice,
        items: items.results || [],
        payments: payments.results || [],
      },
    });
  } catch (e) {
    console.error('Get invoice error:', e);
    return errorResponse('Internal server error', 500);
  }
}

// Create invoice
async function handleCreateInvoice(request, env, user) {
  const data = await request.json();

  if (!data.client_id || !data.items || data.items.length === 0) {
    return errorResponse('Client ID and at least one item are required', 400);
  }

  try {
    // Get client for state check
    const client = await env.DB.prepare(
      'SELECT state_code FROM clients WHERE id = ? AND user_id = ?'
    ).bind(data.client_id, user.id).first();

    if (!client) {
      return errorResponse('Client not found', 404);
    }

    // Calculate GST
    const gstCalculation = calculateGST(data.items, client.state_code, user.state_code);

    // Generate invoice number
    const year = new Date().getFullYear();
    const countResult = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM invoices WHERE invoice_number LIKE ?"
    ).bind(`INV-${year}-%`).first();

    const invoiceNumber = generateInvoiceNumber(year, (countResult.count || 0) + 1);

    // Start transaction
    const tx = env.DB.batch([
      env.DB.prepare(`
        INSERT INTO invoices (user_id, client_id, invoice_number, invoice_date, due_date,
                              subtotal, cgst, sgst, igst, total_amount, notes, terms)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        user.id,
        data.client_id,
        invoiceNumber,
        data.invoice_date || new Date().toISOString().split('T')[0],
        data.due_date || null,
        gstCalculation.subtotal,
        gstCalculation.cgst,
        gstCalculation.sgst,
        gstCalculation.igst,
        gstCalculation.total,
        data.notes || null,
        data.terms || null
      ),
    ]);

    const result = await tx;
    const invoiceId = result[0].meta.last_row_id;

    // Insert invoice items
    const itemInserts = gstCalculation.items.map(item =>
      env.DB.prepare(`
        INSERT INTO invoice_items (invoice_id, description, quantity, rate, amount, gst_percentage, gst_amount)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(invoiceId, item.description, item.quantity, item.rate, item.amount, item.gstPercentage, item.gstAmount)
    );

    if (itemInserts.length > 0) {
      await env.DB.batch(itemInserts);
    }

    // Get created invoice
    const newInvoice = await env.DB.prepare(
      'SELECT * FROM invoices WHERE id = ?'
    ).bind(invoiceId).first();

    return jsonResponse({
      message: 'Invoice created successfully',
      invoice: {
        ...newInvoice,
        items: gstCalculation.items,
      },
    }, 201);
  } catch (e) {
    console.error('Create invoice error:', e);
    return errorResponse('Internal server error', 500);
  }
}

// Update invoice
async function handleUpdateInvoice(request, env, user, invoiceId) {
  const data = await request.json();

  try {
    // Get existing invoice
    const existing = await env.DB.prepare(
      'SELECT * FROM invoices WHERE id = ? AND user_id = ?'
    ).bind(invoiceId, user.id).first();

    if (!existing) {
      return errorResponse('Invoice not found', 404);
    }

    // Update invoice
    await env.DB.prepare(`
      UPDATE invoices
      SET invoice_date = ?, due_date = ?, notes = ?, terms = ?,
          status = ?, amount_paid = ?
      WHERE id = ?
    `).bind(
      data.invoice_date || existing.invoice_date,
      data.due_date || existing.due_date,
      data.notes || existing.notes,
      data.terms || existing.terms,
      data.status || existing.status,
      data.amount_paid !== undefined ? data.amount_paid : existing.amount_paid,
      invoiceId
    ).run();

    // Update items if provided
    if (data.items && data.items.length > 0) {
      // Delete existing items
      await env.DB.prepare(
        'DELETE FROM invoice_items WHERE invoice_id = ?'
      ).bind(invoiceId).run();

      // Get client for GST calculation
      const client = await env.DB.prepare(
        'SELECT state_code FROM clients WHERE id = ?'
      ).bind(existing.client_id).first();

      const gstCalc = calculateGST(data.items, client.state_code, user.state_code);

      // Insert new items
      const itemInserts = gstCalc.items.map(item =>
        env.DB.prepare(`
          INSERT INTO invoice_items (invoice_id, description, quantity, rate, amount, gst_percentage, gst_amount)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(invoiceId, item.description, item.quantity, item.rate, item.amount, item.gstPercentage, item.gstAmount)
      );

      await env.DB.batch(itemInserts);

      // Update totals
      await env.DB.prepare(`
        UPDATE invoices SET subtotal = ?, cgst = ?, sgst = ?, igst = ?, total_amount = ?
        WHERE id = ?
      `).bind(gstCalc.subtotal, gstCalc.cgst, gstCalc.sgst, gstCalc.igst, gstCalc.total, invoiceId).run();
    }

    const updatedInvoice = await env.DB.prepare(
      'SELECT * FROM invoices WHERE id = ?'
    ).bind(invoiceId).first();

    return jsonResponse({
      message: 'Invoice updated successfully',
      invoice: updatedInvoice,
    });
  } catch (e) {
    console.error('Update invoice error:', e);
    return errorResponse('Internal server error', 500);
  }
}

// Delete invoice
async function handleDeleteInvoice(request, env, user, invoiceId) {
  try {
    const result = await env.DB.prepare(
      'DELETE FROM invoices WHERE id = ? AND user_id = ?'
    ).bind(invoiceId, user.id).run();

    if (result.changes === 0) {
      return errorResponse('Invoice not found', 404);
    }

    return jsonResponse({ message: 'Invoice deleted successfully' });
  } catch (e) {
    console.error('Delete invoice error:', e);
    return errorResponse('Internal server error', 500);
  }
}

// Record payment
async function handleCreatePayment(request, env, user, invoiceId) {
  const data = await request.json();

  if (!data.amount || !data.payment_date || !data.payment_method) {
    return errorResponse('Amount, payment date, and method are required', 400);
  }

  try {
    // Get invoice
    const invoice = await env.DB.prepare(
      'SELECT * FROM invoices WHERE id = ? AND user_id = ?'
    ).bind(invoiceId, user.id).first();

    if (!invoice) {
      return errorResponse('Invoice not found', 404);
    }

    // Insert payment
    const result = await env.DB.prepare(`
      INSERT INTO payments (invoice_id, amount, payment_date, payment_method, reference_number, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      invoiceId,
      data.amount,
      data.payment_date,
      data.payment_method,
      data.reference_number || null,
      data.notes || null
    ).run();

    // Update invoice amount_paid and status
    const newAmountPaid = (invoice.amount_paid || 0) + data.amount;
    let newStatus = invoice.status;

    if (newAmountPaid >= invoice.total_amount) {
      newStatus = 'paid';
    } else if (newAmountPaid > 0) {
      newStatus = 'partial';
    }

    await env.DB.prepare(`
      UPDATE invoices SET amount_paid = ?, status = ? WHERE id = ?
    `).bind(newAmountPaid, newStatus, invoiceId).run();

    const payment = await env.DB.prepare(
      'SELECT * FROM payments WHERE id = ?'
    ).bind(result.meta.last_row_id).first();

    return jsonResponse({
      message: 'Payment recorded successfully',
      payment,
    }, 201);
  } catch (e) {
    console.error('Create payment error:', e);
    return errorResponse('Internal server error', 500);
  }
}

// Get payments for invoice
async function handleGetPayments(request, env, user, invoiceId) {
  try {
    const invoice = await env.DB.prepare(
      'SELECT id FROM invoices WHERE id = ? AND user_id = ?'
    ).bind(invoiceId, user.id).first();

    if (!invoice) {
      return errorResponse('Invoice not found', 404);
    }

    const { results } = await env.DB.prepare(
      'SELECT * FROM payments WHERE invoice_id = ? ORDER BY payment_date DESC'
    ).bind(invoiceId).all();

    return jsonResponse({ payments: results || [] });
  } catch (e) {
    console.error('Get payments error:', e);
    return errorResponse('Internal server error', 500);
  }
}

// Export data as JSON
async function handleExportData(request, env, user) {
  try {
    const [clients, invoices, payments] = await Promise.all([
      env.DB.prepare('SELECT * FROM clients WHERE user_id = ?').bind(user.id).all(),
      env.DB.prepare(`
        SELECT i.*, c.name as client_name FROM invoices i
        JOIN clients c ON i.client_id = c.id
        WHERE i.user_id = ?
      `).bind(user.id).all(),
      env.DB.prepare(`
        SELECT p.*, i.invoice_number FROM payments p
        JOIN invoices i ON p.invoice_id = i.id
        WHERE i.user_id = ?
      `).bind(user.id).all(),
    ]);

    return jsonResponse({
      exported_at: new Date().toISOString(),
      data: {
        clients: clients.results || [],
        invoices: invoices.results || [],
        payments: payments.results || [],
      },
    });
  } catch (e) {
    console.error('Export error:', e);
    return errorResponse('Internal server error', 500);
  }
}

// ============== MAIN REQUEST HANDLER ==============

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return handleOptions(request);
    }

    // Public routes (no auth required)
    if (path === '/api/login' && method === 'POST') {
      return handleLogin(request, env);
    }

    // All other routes require authentication
    const user = await getUserFromRequest(request, env);
    if (!user && !path.startsWith('/api/public/')) {
      return errorResponse('Unauthorized', 401);
    }

    // Route matching
    try {
      // Profile routes
      if (path === '/api/profile' && method === 'GET') {
        return handleGetProfile(request, env, user);
      }
      if (path === '/api/profile' && method === 'PUT') {
        return handleUpdateProfile(request, env, user);
      }

      // Dashboard
      if (path === '/api/dashboard' && method === 'GET') {
        return handleGetDashboard(request, env, user);
      }

      // Export
      if (path === '/api/export' && method === 'GET') {
        return handleExportData(request, env, user);
      }

      // Client routes
      if (path === '/api/clients' && method === 'GET') {
        return handleGetClients(request, env, user);
      }
      if (path === '/api/clients' && method === 'POST') {
        return handleCreateClient(request, env, user);
      }
      if (path.match(/^\/api\/clients\/\d+$/) && method === 'GET') {
        const clientId = path.split('/').pop();
        return handleGetClient(request, env, user, clientId);
      }
      if (path.match(/^\/api\/clients\/\d+$/) && method === 'PUT') {
        const clientId = path.split('/').pop();
        return handleUpdateClient(request, env, user, clientId);
      }
      if (path.match(/^\/api\/clients\/\d+$/) && method === 'DELETE') {
        const clientId = path.split('/').pop();
        return handleDeleteClient(request, env, user, clientId);
      }

      // Invoice routes
      if (path === '/api/invoices' && method === 'GET') {
        return handleGetInvoices(request, env, user);
      }
      if (path === '/api/invoices' && method === 'POST') {
        return handleCreateInvoice(request, env, user);
      }
      if (path.match(/^\/api\/invoices\/\d+$/) && method === 'GET') {
        const invoiceId = path.split('/').pop();
        return handleGetInvoice(request, env, user, invoiceId);
      }
      if (path.match(/^\/api\/invoices\/\d+$/) && method === 'PUT') {
        const invoiceId = path.split('/').pop();
        return handleUpdateInvoice(request, env, user, invoiceId);
      }
      if (path.match(/^\/api\/invoices\/\d+$/) && method === 'DELETE') {
        const invoiceId = path.split('/').pop();
        return handleDeleteInvoice(request, env, user, invoiceId);
      }

      // Payment routes
      if (path === '/api/payments' && method === 'POST') {
        const urlParams = new URL(request.url);
        const invoiceId = urlParams.searchParams.get('invoice_id');
        if (!invoiceId) {
          return errorResponse('invoice_id query parameter required', 400);
        }
        return handleCreatePayment(request, env, user, invoiceId);
      }
      if (path.match(/^\/api\/payments\/\d+$/) && method === 'GET') {
        const invoiceId = path.split('/').pop();
        return handleGetPayments(request, env, user, invoiceId);
      }

      // 404 for unmatched routes
      return errorResponse('Not found', 404);

    } catch (e) {
      console.error('Request error:', e);
      return errorResponse('Internal server error', 500);
    }
  },
};
