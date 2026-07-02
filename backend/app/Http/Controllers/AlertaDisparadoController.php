<?php

namespace App\Http\Controllers;

use App\Models\AlertaDisparado;
use Illuminate\Http\RedirectResponse;

class AlertaDisparadoController extends Controller
{
    public function resolver(AlertaDisparado $alertaDisparado): RedirectResponse
    {
        $alertaDisparado->update([
            'resolvido' => true,
            'notificado_em' => $alertaDisparado->notificado_em ?? now(),
        ]);

        return back()->with('success', 'Alerta marcado como resolvido.');
    }

    public function reabrir(AlertaDisparado $alertaDisparado): RedirectResponse
    {
        $alertaDisparado->update(['resolvido' => false]);

        return back()->with('success', 'Alerta reaberto.');
    }
}