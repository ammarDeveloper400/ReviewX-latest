<?php

namespace App\Http\Controllers;

use App\Models\SalaryPayment;
use App\Models\Employee;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class SalaryPaymentController extends Controller
{
    public function index(Request $request)
    {
        $query = SalaryPayment::query();

        if ($request->has('month')) {
            $query->where('month', $request->month);
        }
        if ($request->has('year')) {
            $query->where('year', $request->year);
        }
        if ($request->has('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        $payments = $query->get();
        $roleType = $request->input('role_type');

        $result = [];
        foreach ($payments as $payment) {
            $employee = Employee::find($payment->employee_id);
            
            if ($roleType && $employee?->role_type !== $roleType) {
                continue;
            }

            $paymentData = $payment->toArray();
            if ($employee) {
                $paymentData['employee_name'] = $employee->full_name;
                $paymentData['employee_role'] = $employee->role_type;
            }

            $result[] = $paymentData;
        }

        return response()->json($result);
    }

    public function update(Request $request, string $payment_id)
    {
        $payment = SalaryPayment::find($payment_id);
        if (!$payment) {
            return response()->json(['detail' => 'Salary payment not found'], 404);
        }

        $request->validate([
            'payment_status' => 'nullable|in:Unpaid,Paid',
            'paid_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $user = JWTAuth::parseToken()->authenticate();

        $payment->update($request->only(['payment_status', 'paid_date', 'notes']));
        AuditLog::log($user->id, 'UPDATE', 'salary_payment', $payment_id, $request->all());

        return response()->json(['message' => 'Salary payment updated successfully']);
    }
}
