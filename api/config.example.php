<?php
return [
    'db' => [
        'host' => '127.0.0.1',
        'port' => '3306',
        'name' => 'library_visitors',
        'user' => 'root',
        'password' => '',
        'charset' => 'utf8mb4',
        'timezone' => '+08:00',
    ],
    'allowed_origins' => ['http://localhost', 'http://localhost:5173', 'http://127.0.0.1:5173'],
    'session_secure' => true,
];
