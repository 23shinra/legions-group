<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Str;

final class LoginGenerator
{
    /**
     * @return array{
     *     first_name: string,
     *     last_name: string|null,
     *     login: string,
     *     display_name: string
     * }
     */
    public static function fromFullName(string $fullName): array
    {
        $parts = preg_split('/\s+/u', trim($fullName), -1, PREG_SPLIT_NO_EMPTY) ?: [];

        if ($parts === []) {
            throw new \InvalidArgumentException('Full name cannot be empty.');
        }

        if (count($parts) === 1) {
            $firstName = $parts[0];

            return [
                'first_name' => $firstName,
                'last_name' => null,
                'login' => self::slug($firstName),
                'display_name' => $firstName,
            ];
        }

        $lastName = $parts[0];
        $firstName = $parts[1];

        return [
            'first_name' => $firstName,
            'last_name' => $lastName,
            'login' => self::slug($firstName).'.'.self::slug($lastName),
            'display_name' => "{$lastName} {$firstName}",
        ];
    }

    public static function slug(string $value): string
    {
        $transliterated = Str::transliterate(trim($value));

        return Str::lower(preg_replace('/[^a-z0-9]+/i', '', $transliterated) ?? '');
    }

    public static function uniqueLogin(string $baseLogin): string
    {
        $login = Str::lower(trim($baseLogin));
        $candidate = $login;
        $suffix = 2;

        while (User::query()->where('email', $candidate)->exists()) {
            $candidate = "{$login}{$suffix}";
            $suffix++;
        }

        return $candidate;
    }
}
