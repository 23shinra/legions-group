<?php

declare(strict_types=1);

namespace App\Http\Requests\Manager;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Validator;

final class ClearOperationalDataRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === UserRole::Manager;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'password' => ['required', 'string'],
            'confirm' => ['required', 'accepted'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'password.required' => 'Введите пароль для подтверждения.',
            'confirm.accepted' => 'Подтвердите, что понимаете последствия очистки.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $user = $this->user();

            if ($user === null || ! Hash::check((string) $this->input('password'), (string) $user->password)) {
                $validator->errors()->add('password', 'Неверный пароль.');
            }
        });
    }
}
