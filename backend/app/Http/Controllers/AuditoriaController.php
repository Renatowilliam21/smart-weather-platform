<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

class AuditoriaController extends Controller
{
    public function index(Request $request): Response
    {
        $registros = Activity::with('causer')
            ->latest()
            ->paginate(30)
            ->through(function ($atividade) {
                return [
                    'id' => $atividade->id,
                    'log_name' => $atividade->log_name,
                    'description' => $atividade->description,
                    'subject_type' => class_basename($atividade->subject_type),
                    'subject_id' => $atividade->subject_id,
                    'causer_nome' => $atividade->causer->name ?? 'Sistema',
                    'properties' => $atividade->properties,
                    'created_at' => $atividade->created_at,
                ];
            });

        return Inertia::render('Auditoria/Index', [
            'registros' => $registros,
        ]);
    }
}
