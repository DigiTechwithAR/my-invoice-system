-- Seed Data for Invoice System
-- Run after schema initialization

-- Default admin user (password: admin123)
-- In production, use proper password hashing
INSERT OR IGNORE INTO users (id, email, password_hash, business_name, business_address, business_phone, business_gst, business_pan, state_code)
VALUES (
    1,
    'admin@example.com',
    'admin123',  -- In production, use bcrypt or similar
    'Acme Consulting',
    '123 Business Park, Andheri East, Mumbai',
    '+91 98765 43210',
    '27AABCU1234A1Z5',
    'AABCU1234A',
    '27'  -- Maharashtra state code
);

-- Sample clients
INSERT OR IGNORE INTO clients (id, user_id, name, email, phone, address, gst_number, pan_number, state_code, state_name)
VALUES
    (1, 1, 'Rajesh Kumar', 'rajesh@techcorp.in', '+91 98765 11111', '456 Tech Park, Bangalore', '29AABCT1234A1Z3', 'AABCT1234A', '29', 'Karnataka'),
    (2, 1, 'Priya Sharma', 'priya@designstudio.in', '+91 98765 22222', '789 Creative Hub, Pune', '27AABCD5678B1Z2', 'AABCD5678B', '27', 'Maharashtra'),
    (3, 1, 'Amit Patel', 'amit@retailstore.in', '+91 98765 33333', '321 Market Road, Ahmedabad', '24AABCP9876C1Z1', 'AABCP9876C', '24', 'Gujarat'),
    (4, 1, 'Sneha Reddy', 'sneha@startup.in', '+91 98765 44444', '654 Innovation Center, Hyderabad', '36AABCS4321D1Z9', 'AABCS4321D', '36', 'Telangana');

-- Sample invoices
INSERT OR IGNORE INTO invoices (id, user_id, client_id, invoice_number, invoice_date, due_date, subtotal, cgst, sgst, igst, total_amount, amount_paid, status, notes)
VALUES
    (1, 1, 1, 'INV-2024-0001', '2024-01-15', '2024-02-15', 50000, 0, 0, 9000, 59000, 59000, 'paid', 'Thank you for your business!'),
    (2, 1, 2, 'INV-2024-0002', '2024-01-20', '2024-02-20', 35000, 3150, 3150, 0, 41300, 20000, 'partial', 'Please complete payment by due date.'),
    (3, 1, 3, 'INV-2024-0003', '2024-02-01', '2024-03-01', 75000, 0, 0, 13500, 88500, 0, 'unpaid', 'Net 30 payment terms.'),
    (4, 1, 4, 'INV-2024-0004', '2024-02-10', '2024-03-10', 25000, 0, 0, 4500, 29500, 0, 'unpaid', 'Startup discount applied.');

-- Sample invoice itemsssssss
INSERT OR IGNORE INTO invoice_items (id, invoice_id, description, quantity, rate, amount, gst_percentage, gst_amount)
VALUES
    -- Invoice 1 items (IGST 18%)
    (1, 1, 'Web Development Services', 40, 1000, 40000, 18, 7200),
    (2, 1, 'SEO Consultation', 10, 1000, 10000, 18, 1800),

    -- Invoice 2 items (CGST + SGST 9% each = 18%)
    (3, 2, 'UI/UX Design', 25, 800, 20000, 18, 3600),
    (4, 2, 'Brand Identity', 1, 15000, 15000, 18, 2700),

    -- Invoice 3 items (IGST 18%)
    (5, 3, 'E-commerce Development', 60, 1000, 60000, 18, 10800),
    (6, 3, 'Payment Gateway Integration', 1, 15000, 15000, 18, 2700),

    -- Invoice 4 items (IGST 18%)
    (7, 4, 'Mobile App Consultation', 20, 1000, 20000, 18, 3600),
    (8, 4, 'Technical Documentation', 5, 1000, 5000, 18, 900);

-- Sample payments
INSERT OR IGNORE INTO payments (id, invoice_id, amount, payment_date, payment_method, reference_number, notes)
VALUES
    (1, 1, 59000, '2024-01-25', 'upi', 'UPI/240125123456/RAJESH', 'Full payment received'),
    (2, 2, 20000, '2024-02-01', 'bank_transfer', 'NEFT/240201/HDFC001', 'Partial payment - remaining due');
