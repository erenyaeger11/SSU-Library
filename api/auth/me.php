<?php
require_once __DIR__ . '/../_bootstrap.php';
require_method('GET');
$admin = require_auth(true);
respond(true, 'Signed in.', $admin);
