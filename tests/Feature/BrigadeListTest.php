<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class BrigadeListTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed();
    }

    public function test_manager_brigade_cards_use_brigadier_last_and_first_name(): void
    {
        $manager = $this->rosterUser('islam.ashirov');

        $this->actingAs($manager)
            ->get(route('manager.brigades.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Manager/Brigades/Index')
                ->has('brigades', 4)
                ->where('brigades', function ($brigades): bool {
                    $labels = collect($brigades)->pluck('display_name');

                    return $labels->contains('Абдурашитов Ильяр')
                        && $labels->contains('Кадыров Абдыкахар')
                        && $labels->contains('Кадыров Турсун');
                }));
    }

    public function test_user_family_name_joins_last_and_first_name(): void
    {
        $user = new User([
            'name' => 'Короткое',
            'first_name' => 'Ильяр',
            'last_name' => 'Абдурашитов',
        ]);

        $this->assertSame('Абдурашитов Ильяр', $user->familyName());
    }
}
