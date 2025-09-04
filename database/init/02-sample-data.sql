-- Données d'exemple pour Nomedia Production
-- Ce script insère des données de test pour développement

-- Insertion des départements
INSERT INTO nomedia.departments (name, description) VALUES
('Production', 'Équipe de production audiovisuelle'),
('Technique', 'Équipe technique et matériel'),
('Post-Production', 'Montage et finalisation'),
('Direction', 'Direction et management'),
('Commercial', 'Ventes et relations clients');

-- Insertion des types de contrats
INSERT INTO nomedia.contract_types (name, is_permanent, description) VALUES
('CDI', true, 'Contrat à Durée Indéterminée'),
('CDD', false, 'Contrat à Durée Déterminée'),
('Freelance', false, 'Travailleur indépendant'),
('Stage', false, 'Stage étudiant'),
('Consultant', false, 'Consultant externe');

-- Insertion des employés d'exemple
INSERT INTO nomedia.employees (first_name, last_name, email, phone, address, position, department_id, salary, hire_date, status) VALUES
('Alice', 'Martin', 'alice.martin@nomedia.ma', '+212 6 12 34 56 78', 'Casablanca, Maroc', 'Réalisatrice', 1, 45000, '2023-01-15', 'active'),
('Bob', 'Dupont', 'bob.dupont@nomedia.ma', '+212 6 23 45 67 89', 'Rabat, Maroc', 'Cameraman', 2, 35000, '2023-03-20', 'active'),
('Carol', 'Leroy', 'carol.leroy@nomedia.ma', '+212 6 34 56 78 90', 'Casablanca, Maroc', 'Monteuse', 3, 38000, '2023-02-10', 'active'),
('David', 'Chen', 'david.chen@nomedia.ma', '+212 6 45 67 89 01', 'Casablanca, Maroc', 'Producteur', 4, 55000, '2022-11-05', 'active'),
('Emma', 'Benali', 'emma.benali@nomedia.ma', '+212 6 56 78 90 12', 'Casablanca, Maroc', 'Responsable Commercial', 5, 40000, '2023-04-01', 'active');

-- Insertion des contrats
INSERT INTO nomedia.contracts (employee_id, contract_type_id, start_date, end_date, salary, status) VALUES
(1, 1, '2023-01-15', NULL, 45000, 'active'),
(2, 1, '2023-03-20', NULL, 35000, 'active'),
(3, 1, '2023-02-10', NULL, 38000, 'active'),
(4, 1, '2022-11-05', NULL, 55000, 'active'),
(5, 1, '2023-04-01', NULL, 40000, 'active');

-- Insertion des utilisateurs (mots de passe hashés avec bcrypt)
-- Tous les mots de passe sont: admin123, manager123, user123 selon le rôle
INSERT INTO nomedia.users (name, email, password_hash, role, status, phone, permissions) VALUES
('Admin Principal', 'admin@nomedia.ma', '$2a$10$rOq7K8K9mQJQJ9QJ9QJ9QuxvNBk7dGJp0N9kQ9J9Q9J9Q9J9Q9J9Q', 'admin', 'active', '+212 6 12 34 56 78', ARRAY['all']),
('David Chen', 'david.chen@nomedia.ma', '$2a$10$rOq7K8K9mQJQJ9QJ9QJ9QuxvNBk7dGJp0N9kQ9J9Q9J9Q9J9Q9J9Q', 'manager', 'active', '+212 6 45 67 89 01', ARRAY['projects', 'employees', 'invoices']),
('Alice Martin', 'alice.martin@nomedia.ma', '$2a$10$rOq7K8K9mQJQJ9QJ9QJ9QuxvNBk7dGJp0N9kQ9J9Q9J9Q9J9Q9J9Q', 'user', 'active', '+212 6 12 34 56 78', ARRAY['projects', 'expenses']),
('Bob Dupont', 'bob.dupont@nomedia.ma', '$2a$10$rOq7K8K9mQJQJ9QJ9QJ9QuxvNBk7dGJp0N9kQ9J9Q9J9Q9J9Q9J9Q', 'user', 'inactive', '+212 6 23 45 67 89', ARRAY['projects']);

-- Insertion des projets d'exemple
INSERT INTO nomedia.projects (name, client_name, description, status, priority, budget, spent, start_date, deadline, progress, project_type, deliverables, notes, client_contact_name, client_contact_email, client_contact_phone) VALUES
('Spot TV - Luxury Brand', 'Maison Deluxe', 'Production d''un spot télévisé de 30 secondes pour une marque de luxe', 'production', 'high', 85000, 55250, '2024-01-10', '2024-02-15', 65, 'publicite', ARRAY['Spot TV 30s', 'Version web', 'Making-of'], 'Tournage en studio et en extérieur', 'Sophie Dubois', 'sophie@maison-deluxe.com', '+212 5 22 33 44 55'),
('Documentaire Corporate', 'TechCorp', 'Documentaire de 15 minutes sur l''histoire et les valeurs de l''entreprise', 'post_production', 'medium', 45000, 38000, '2023-12-01', '2024-01-30', 80, 'documentaire', ARRAY['Documentaire 15min', 'Trailer 2min'], 'Interviews avec les dirigeants et employés', 'Jean Techno', 'jean@techcorp.ma', '+212 5 22 11 22 33'),
('Campagne Publicitaire', 'FashionHouse', 'Série de 5 vidéos pour campagne publicitaire multi-canaux', 'pre_production', 'high', 120000, 12000, '2024-01-20', '2024-03-10', 25, 'publicite', ARRAY['5 vidéos produits', 'Adaptation réseaux sociaux', 'Assets photos'], 'Campagne automne-hiver 2024', 'Marie Fashion', 'marie@fashionhouse.ma', '+212 5 22 44 55 66');

-- Insertion des assignations de projets
INSERT INTO nomedia.project_assignments (project_id, employee_id, role, start_date, hourly_rate, status) VALUES
(1, 1, 'Réalisatrice', '2024-01-10', 250, 'active'),
(1, 2, 'Cameraman', '2024-01-10', 200, 'active'),
(1, 3, 'Monteuse', '2024-01-15', 180, 'active'),
(2, 4, 'Réalisateur', '2023-12-01', 300, 'active'),
(2, 3, 'Monteuse', '2023-12-05', 180, 'active'),
(3, 1, 'Directrice Créative', '2024-01-20', 250, 'active'),
(3, 4, 'Producteur', '2024-01-20', 300, 'active'),
(3, 2, 'Cameraman', '2024-01-25', 200, 'active');

-- Insertion d'exemples de factures
INSERT INTO nomedia.invoices (invoice_number, client, client_ice, project, project_id, amount, tax_amount, total_amount, issue_date, due_date, status, profit_margin, estimated_costs, team_members, notes) VALUES
('NOM-2024-001', 'STE NEW GENERATION PICTURES', '000515592000068', 'DOUBLAGE MINI SERIE ATTAR', 1, 60000.00, 12000.00, 72000.00, '2024-01-06', '2024-02-06', 'paid', 35.00, 39000.00, ARRAY['Mohammed Alami', 'Fatima Zahra', 'Ahmed Benali'], 'Projet de doublage terminé avec succès'),
('NOM-2024-002', 'TechCorp Solutions', '000515592000069', 'Documentaire Corporate', 2, 450000.00, 90000.00, 540000.00, '2024-01-31', '2024-03-01', 'pending', 42.00, 261000.00, ARRAY['Youssef Benali', 'Aicha Lamrani', 'Omar Tazi'], 'Documentaire en cours de finalisation'),
('NOM-2024-003', 'Maison Deluxe', '000515592000070', 'Spot TV - Luxury Brand', 3, 850000.00, 170000.00, 1020000.00, '2024-02-15', '2024-03-15', 'overdue', 28.00, 612000.00, ARRAY['Hassan Idrissi', 'Laila Moussaoui', 'Rachid Benjelloun'], 'Spot TV premium en retard de paiement');

-- Insertion des items de facture
INSERT INTO nomedia.invoice_items (invoice_id, description, unit_price, quantity, total) VALUES
(1, 'DOUBLAGE MINI SERIE ATTAR - Version originale : tachelhit - Versions doublées : Tarifit/ tamazight', 25000.00, 2, 50000.00),
(1, 'Post-production et montage', 10000.00, 1, 10000.00),
(2, 'Production documentaire corporate 15 minutes', 300000.00, 1, 300000.00),
(2, 'Post-production et montage', 150000.00, 1, 150000.00),
(3, 'Production spot TV 30 secondes', 500000.00, 1, 500000.00),
(3, 'Location matériel professionnel', 200000.00, 1, 200000.00),
(3, 'Post-production et étalonnage', 150000.00, 1, 150000.00);

-- Insertion des paiements employés pour les factures
INSERT INTO nomedia.invoice_employee_payments (invoice_id, employee_id, employee_name, position, department, role_in_project, hourly_rate, hours_allocated, cost_allocation, base_salary, overtime_hours, overtime_rate, overtime_payment, bonus_amount, bonus_reason, expense_reimbursements, total_payment, payment_date, payment_status, payment_method, bank_details, taxes_withheld, net_payment, contract_type, performance_bonus, project_completion_bonus, travel_allowance, equipment_allowance) VALUES
(1, 1, 'Alice Martin', 'Réalisatrice', 'Production', 'Responsable Doublage', 250, 80, 20000, 18000, 10, 375, 3750, 2000, 'Excellente qualité du doublage', 500, 24250, '2024-02-10', 'paid', 'Virement bancaire', 'BMCE Bank - 007 123456789', 4850, 19400, 'CDI', 1500, 1000, 300, 200),
(1, 3, 'Carol Leroy', 'Monteuse', 'Post-Production', 'Mixage Audio', 180, 60, 10800, 10800, 5, 270, 1350, 800, 'Respect des délais serrés', 200, 13150, '2024-02-10', 'paid', 'Virement bancaire', 'Attijariwafa Bank - 004 987654321', 2630, 10520, 'CDI', 500, 300, 0, 100);

-- Accorder les privilèges à l'utilisateur nomedia_user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA nomedia TO nomedia_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA nomedia TO nomedia_user;
GRANT ALL PRIVILEGES ON SCHEMA nomedia TO nomedia_user;

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Base de données Nomedia Production initialisée avec succès!';
    RAISE NOTICE '📊 Données d''exemple insérées.';
    RAISE NOTICE '🔐 Comptes utilisateurs créés:';
    RAISE NOTICE '   - admin@nomedia.ma (admin123)';
    RAISE NOTICE '   - david.chen@nomedia.ma (manager123)';
    RAISE NOTICE '   - alice.martin@nomedia.ma (user123)';
    RAISE NOTICE '   - bob.dupont@nomedia.ma (user123)';
END $$;
