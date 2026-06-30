#!/bin/bash
# Seed traffic data directly via team-db
set -e

team-db "INSERT OR IGNORE INTO site_traffic (id, path, method, user_agent, ip_address, duration_ms, created_at) VALUES ('seed-01', '/', 'GET', 'Mozilla/5.0 (iPhone)', '192.168.1.10', 1200, datetime('now', '-6 days', '+10 hours'))"
team-db "INSERT OR IGNORE INTO site_traffic (id, path, method, user_agent, ip_address, duration_ms, created_at) VALUES ('seed-02', '/', 'GET', 'Mozilla/5.0 (Android)', '192.168.1.11', 800, datetime('now', '-5 days', '+14 hours'))"
team-db "INSERT OR IGNORE INTO site_traffic (id, path, method, user_agent, ip_address, duration_ms, created_at) VALUES ('seed-03', '/discover', 'GET', 'Mozilla/5.0 (Mac)', '10.0.0.1', 3400, datetime('now', '-5 days', '+16 hours'))"
team-db "INSERT OR IGNORE INTO site_traffic (id, path, method, user_agent, ip_address, duration_ms, created_at) VALUES ('seed-04', '/concierge', 'GET', 'Mozilla/5.0 (iPhone)', '192.168.1.12', 5000, datetime('now', '-4 days', '+9 hours'))"
team-db "INSERT OR IGNORE INTO site_traffic (id, path, method, user_agent, ip_address, duration_ms, created_at) VALUES ('seed-05', '/register', 'GET', 'Mozilla/5.0 (Windows)', '10.0.0.2', 2100, datetime('now', '-4 days', '+11 hours'))"
team-db "INSERT OR IGNORE INTO site_traffic (id, path, method, user_agent, ip_address, duration_ms, created_at) VALUES ('seed-06', '/login', 'GET', 'Mozilla/5.0 (iPhone)', '192.168.1.13', 1500, datetime('now', '-3 days', '+8 hours'))"
team-db "INSERT OR IGNORE INTO site_traffic (id, path, method, user_agent, ip_address, duration_ms, created_at) VALUES ('seed-07', '/profile', 'GET', 'Mozilla/5.0 (Android)', '172.16.0.1', 6500, datetime('now', '-3 days', '+20 hours'))"
team-db "INSERT OR IGNORE INTO site_traffic (id, path, method, user_agent, ip_address, duration_ms, created_at) VALUES ('seed-08', '/circle', 'GET', 'Mozilla/5.0 (Mac)', '10.0.0.3', 4200, datetime('now', '-2 days', '+12 hours'))"
team-db "INSERT OR IGNORE INTO site_traffic (id, path, method, user_agent, ip_address, duration_ms, created_at) VALUES ('seed-09', '/discover', 'GET', 'Mozilla/5.0 (iPhone)', '192.168.1.14', 900, datetime('now', '-2 days', '+15 hours'))"
team-db "INSERT OR IGNORE INTO site_traffic (id, path, method, user_agent, ip_address, duration_ms, created_at) VALUES ('seed-10', '/', 'GET', 'Mozilla/5.0 (Android)', '172.16.0.2', 3000, datetime('now', '-1 days', '+10 hours'))"
team-db "INSERT OR IGNORE INTO site_traffic (id, path, method, user_agent, ip_address, duration_ms, created_at) VALUES ('seed-11', '/concierge', 'GET', 'Mozilla/5.0 (iPhone)', '192.168.1.15', 7200, datetime('now', '-1 days', '+18 hours'))"
team-db "INSERT OR IGNORE INTO site_traffic (id, path, method, user_agent, ip_address, duration_ms, created_at) VALUES ('seed-12', '/login', 'GET', 'Mozilla/5.0 (Windows)', '10.0.0.4', 1100, datetime('now', '-0 days', '+7 hours'))"
team-db "INSERT OR IGNORE INTO site_traffic (id, path, method, user_agent, ip_address, duration_ms, created_at) VALUES ('seed-13', '/register', 'GET', 'Mozilla/5.0 (iPhone)', '192.168.1.16', 4500, datetime('now', '-0 days', '+9 hours'))"
team-db "INSERT OR IGNORE INTO site_traffic (id, path, method, user_agent, ip_address, duration_ms, created_at) VALUES ('seed-14', '/swap-marketplace', 'GET', 'Mozilla/5.0 (Android)', '172.16.0.3', 3800, datetime('now', '-0 days', '+11 hours'))"
team-db "INSERT OR IGNORE INTO site_traffic (id, path, method, user_agent, ip_address, duration_ms, created_at) VALUES ('seed-15', '/verification', 'GET', 'Mozilla/5.0 (Mac)', '10.0.0.5', 2900, datetime('now', '-0 days', '+13 hours'))"
team-db "INSERT OR IGNORE INTO site_traffic (id, path, method, user_agent, ip_address, duration_ms, created_at) VALUES ('seed-16', '/analytics-dashboard', 'GET', 'Mozilla/5.0 (iPhone)', '192.168.1.17', 1600, datetime('now', '-0 days', '+15 hours'))"
team-db "INSERT OR IGNORE INTO site_traffic (id, path, method, user_agent, ip_address, duration_ms, created_at) VALUES ('seed-17', '/partner', 'GET', 'Mozilla/5.0 (Android)', '172.16.0.4', 5500, datetime('now', '-0 days', '+17 hours'))"
team-db "INSERT OR IGNORE INTO site_traffic (id, path, method, user_agent, ip_address, duration_ms, created_at) VALUES ('seed-18', '/', 'GET', 'Mozilla/5.0 (iPhone)', '192.168.1.18', 2200, datetime('now', '-0 days', '+20 hours'))"
team-db "INSERT OR IGNORE INTO site_traffic (id, path, method, user_agent, ip_address, duration_ms, created_at) VALUES ('seed-19', '/discover', 'GET', 'Mozilla/5.0 (Windows)', '10.0.0.6', 4100, datetime('now', '+0 hours'))"
team-db "INSERT OR IGNORE INTO site_traffic (id, path, method, user_agent, ip_address, duration_ms, created_at) VALUES ('seed-20', '/concierge', 'GET', 'Mozilla/5.0 (Mac)', '10.0.0.7', 3300, datetime('now', '+0 hours'))"

echo "20 seed rows inserted"
team-db "SELECT COUNT(*) as count FROM site_traffic"