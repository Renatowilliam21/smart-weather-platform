<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class DocumentacaoController extends Controller
{
    public function sensores(): Response
    {
        return Inertia::render('Documentacao/Sensores');
    }
}