-- Query table structures
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
    AND table_name IN (
        'payment_transactions',
        'payments',
        'payment_history',
        'payment_receipts',
        'payment_methods',
        'payment_settings',
        'payment_analytics',
        'backup_tickets_2024',
        'migration_tracking'
    )
ORDER BY 
    table_name,
    ordinal_position; 