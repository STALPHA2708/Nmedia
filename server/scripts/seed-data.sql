-- Sample data for Nomedia Production Employee Management System

-- Insert sample employees
INSERT INTO employees (first_name, last_name, email, phone, address, position, department_id, salary, hire_date, status) VALUES 
    ('Alice', 'Martin', 'alice.martin@nomedia.ma', '+212 6 12 34 56 78', '123 Rue Hassan II, Casablanca', 'Réalisatrice Senior', 1, 45000, '2023-01-15', 'active'),
    ('Bob', 'Dupont', 'bob.dupont@nomedia.ma', '+212 6 23 45 67 89', '45 Avenue Mohammed V, Rabat', 'Cadreur Principal', 2, 35000, '2023-03-20', 'active'),
    ('Carol', 'Leroy', 'carol.leroy@nomedia.ma', '+212 6 34 56 78 90', '67 Boulevard Zerktouni, Casablanca', 'Monteuse', 3, 38000, '2023-02-10', 'active'),
    ('David', 'Chen', 'david.chen@nomedia.ma', '+212 6 45 67 89 01', '89 Rue Allal Ben Abdellah, Casablanca', 'Producteur Exécutif', 4, 55000, '2022-11-05', 'active'),
    ('Fatima', 'Alaoui', 'fatima.alaoui@nomedia.ma', '+212 6 56 78 90 12', '12 Rue de la Liberté, Marrakech', 'Scripte', 1, 32000, '2023-05-12', 'inactive'),
    ('Mohamed', 'Benali', 'mohamed.benali@nomedia.ma', '+212 6 67 89 01 23', '34 Avenue Atlas, Casablanca', 'Ingénieur Son', 2, 40000, '2023-04-01', 'active'),
    ('Laila', 'Cherkaoui', 'laila.cherkaoui@nomedia.ma', '+212 6 78 90 12 34', '56 Rue Ibn Battuta, Rabat', 'Étalonnense', 3, 42000, '2023-06-15', 'active'),
    ('Omar', 'Tazi', 'omar.tazi@nomedia.ma', '+212 6 89 01 23 45', '78 Boulevard Mohammed VI, Casablanca', 'Chef de Projet', 4, 48000, '2022-09-10', 'active'),
    ('Aicha', 'Mansouri', 'aicha.mansouri@nomedia.ma', '+212 6 90 12 34 56', '90 Rue Al Andalous, Fès', 'Assistante de Production', 1, 28000, '2023-07-20', 'active'),
    ('Youssef', 'Kadiri', 'youssef.kadiri@nomedia.ma', '+212 6 01 23 45 67', '21 Avenue Hassan II, Marrakech', 'Motion Designer', 3, 36000, '2023-08-05', 'on_leave');

-- Insert employee contracts
INSERT INTO employee_contracts (employee_id, contract_type_id, start_date, end_date, salary, status, contract_file_name) VALUES 
    (1, 1, '2023-01-15', NULL, 45000, 'active', 'alice_martin_cdi_2023.pdf'),
    (2, 1, '2023-03-20', NULL, 35000, 'active', 'bob_dupont_cdi_2023.pdf'),
    (3, 1, '2023-02-10', NULL, 38000, 'active', 'carol_leroy_cdi_2023.pdf'),
    (4, 1, '2022-11-05', NULL, 55000, 'active', 'david_chen_cdi_2022.pdf'),
    (5, 2, '2023-05-12', '2023-11-12', 32000, 'expired', 'fatima_alaoui_cdd_2023.pdf'),
    (6, 1, '2023-04-01', NULL, 40000, 'active', 'mohamed_benali_cdi_2023.pdf'),
    (7, 1, '2023-06-15', NULL, 42000, 'active', 'laila_cherkaoui_cdi_2023.pdf'),
    (8, 1, '2022-09-10', NULL, 48000, 'active', 'omar_tazi_cdi_2022.pdf'),
    (9, 2, '2023-07-20', '2024-01-20', 28000, 'active', 'aicha_mansouri_cdd_2023.pdf'),
    (10, 3, '2023-08-05', '2023-12-05', 36000, 'active', 'youssef_kadiri_freelance_2023.pdf');

-- Insert sample projects
INSERT INTO projects (name, client_name, description, budget, spent, start_date, deadline, status, priority, progress) VALUES 
    ('Spot TV - Luxury Brand', 'Maison Deluxe', 'Production d''un spot télévisé de 30 secondes pour une marque de luxe', 850000, 552500, '2024-01-10', '2024-02-15', 'production', 'high', 65),
    ('Documentaire Corporate', 'TechCorp Solutions', 'Documentaire de 15 minutes sur l''histoire et les valeurs de l''entreprise', 450000, 360000, '2023-12-01', '2024-01-30', 'post_production', 'medium', 80),
    ('Campagne Publicitaire', 'FashionHouse', 'Série de 5 vidéos pour campagne publicitaire multi-canaux', 1200000, 300000, '2024-01-20', '2024-03-10', 'pre_production', 'high', 25),
    ('Vidéo Formation', 'EduPlus', 'Modules de formation e-learning interactifs', 250000, 245000, '2023-11-15', '2024-01-05', 'completed', 'low', 100),
    ('Clip Musical', 'Universal Music Morocco', 'Clip musical pour artiste local', 180000, 45000, '2024-02-01', '2024-02-28', 'production', 'medium', 35),
    ('Série Web', 'Netflix Maroc', 'Pilote pour série web marocaine', 2500000, 750000, '2024-01-05', '2024-06-30', 'production', 'urgent', 30);

-- Insert project assignments
INSERT INTO project_assignments (employee_id, project_id, role, start_date, end_date, hourly_rate, status) VALUES 
    -- Spot TV - Luxury Brand
    (1, 1, 'Réalisatrice', '2024-01-10', '2024-02-15', 250, 'active'),
    (2, 1, 'Cadreur Principal', '2024-01-10', '2024-02-15', 180, 'active'),
    (3, 1, 'Monteuse', '2024-01-25', '2024-02-15', 200, 'active'),
    (6, 1, 'Ingénieur Son', '2024-01-10', '2024-02-15', 190, 'active'),
    
    -- Documentaire Corporate
    (4, 2, 'Producteur', '2023-12-01', '2024-01-30', 300, 'completed'),
    (1, 2, 'Réalisatrice', '2023-12-01', '2024-01-30', 250, 'completed'),
    (7, 2, 'Étalonnense', '2024-01-15', '2024-01-30', 220, 'completed'),
    
    -- Campagne Publicitaire
    (8, 3, 'Chef de Projet', '2024-01-20', '2024-03-10', 280, 'active'),
    (9, 3, 'Assistante de Production', '2024-01-20', '2024-03-10', 150, 'active'),
    (10, 3, 'Motion Designer', '2024-02-01', '2024-03-10', 200, 'paused'),
    
    -- Vidéo Formation
    (4, 4, 'Producteur', '2023-11-15', '2024-01-05', 300, 'completed'),
    (2, 4, 'Cadreur', '2023-11-20', '2023-12-10', 180, 'completed'),
    
    -- Clip Musical
    (1, 5, 'Réalisatrice', '2024-02-01', '2024-02-28', 250, 'active'),
    (6, 5, 'Ingénieur Son', '2024-02-01', '2024-02-28', 190, 'active'),
    
    -- Série Web
    (4, 6, 'Producteur Exécutif', '2024-01-05', '2024-06-30', 350, 'active'),
    (8, 6, 'Chef de Projet', '2024-01-05', '2024-06-30', 280, 'active'),
    (1, 6, 'Réalisatrice', '2024-02-01', '2024-04-30', 300, 'active');

-- Insert employee skills
INSERT INTO employee_skills (employee_id, skill_name, proficiency_level, years_experience) VALUES 
    (1, 'Direction d''acteurs', 'expert', 8),
    (1, 'Écriture de scénario', 'advanced', 6),
    (1, 'Montage', 'intermediate', 4),
    (2, 'Caméra 4K', 'expert', 7),
    (2, 'Éclairage', 'advanced', 5),
    (2, 'Drone', 'intermediate', 3),
    (3, 'Avid Media Composer', 'expert', 6),
    (3, 'DaVinci Resolve', 'advanced', 4),
    (3, 'After Effects', 'intermediate', 3),
    (4, 'Gestion de budget', 'expert', 10),
    (4, 'Planification', 'expert', 12),
    (4, 'Négociation', 'advanced', 8),
    (6, 'Pro Tools', 'expert', 9),
    (6, 'Sound Design', 'advanced', 6),
    (6, 'Mixage', 'expert', 8),
    (7, 'Étalonnage', 'expert', 5),
    (7, 'DaVinci Resolve', 'expert', 5),
    (8, 'Management d''équipe', 'advanced', 7),
    (8, 'Coordination', 'expert', 9),
    (10, 'After Effects', 'expert', 4),
    (10, 'Cinema 4D', 'advanced', 3),
    (10, 'Motion Graphics', 'expert', 5);

-- Update project spent amounts based on assignments
UPDATE projects SET 
    spent = (
        SELECT COALESCE(SUM(
            CASE 
                WHEN pa.hourly_rate IS NOT NULL AND pa.end_date IS NOT NULL 
                THEN pa.hourly_rate * EXTRACT(EPOCH FROM (pa.end_date - pa.start_date))/3600/8 * 8 -- Assuming 8h work days
                WHEN pa.hourly_rate IS NOT NULL 
                THEN pa.hourly_rate * EXTRACT(EPOCH FROM (CURRENT_DATE - pa.start_date))/3600/8 * 8
                ELSE 0
            END
        ), 0)
        FROM project_assignments pa
        WHERE pa.project_id = projects.id
    );
