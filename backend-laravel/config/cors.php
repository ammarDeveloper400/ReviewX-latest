<?php

// return [
//     'paths' => ['api/*', 'sanctum/csrf-cookie'],
//     'allowed_methods' => ['*'],
//     'allowed_origins' => [
//     'https://reviewx.code-xperts.com',
// ],
//     'allowed_origins_patterns' => [],
//     'allowed_headers' => ['*'],
//     'exposed_headers' => [],
//     'max_age' => 0,
//     'supports_credentials' => false,
// ];

    return [
  'paths' => ['api/*', 'login', 'sanctum/csrf-cookie'],

  'allowed_methods' => ['*'],

  'allowed_origins' => [
    'https://reviewx.code-xperts.com',
    'http://localhost:3000',
    'http://localhost:5173',
  ],

  'allowed_origins_patterns' => [],

  'allowed_headers' => ['*'],

  'exposed_headers' => [],

  'max_age' => 0,

  'supports_credentials' => false,
];
