<?php

namespace App\Http\Controllers;

use App\Models\AdminAuditLog;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    public function suspend(Request $request, User $user): RedirectResponse
    {
        if ($request->user()->is($user)) {
            return back()->with('error', 'Vous ne pouvez pas suspendre votre propre compte.');
        }

        $user->forceFill([
            'suspended_at' => now(),
        ])->save();

        AdminAuditLog::create([
            'admin_id' => $request->user()->id,
            'target_user_id' => $user->id,
            'action' => 'suspend',
        ]);

        return back()->with('success', 'Utilisateur suspendu.');
    }

    public function restore(Request $request, User $user): RedirectResponse
    {
        $user->forceFill([
            'suspended_at' => null,
        ])->save();

        AdminAuditLog::create([
            'admin_id' => $request->user()->id,
            'target_user_id' => $user->id,
            'action' => 'restore',
        ]);

        return back()->with('success', 'Utilisateur reactive.');
    }
}
