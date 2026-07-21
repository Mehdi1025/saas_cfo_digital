<?php

namespace Tests\Feature;

use Tests\TestCase;

class LegalPagesTest extends TestCase
{
    public function test_terms_page_is_publicly_available(): void
    {
        $this->get('/conditions-generales')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Legal/ConditionsGenerales'));
    }

    public function test_privacy_page_is_publicly_available(): void
    {
        $this->get('/confidentialite')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Legal/Confidentialite'));
    }

    public function test_legacy_cgv_url_redirects_to_terms_page(): void
    {
        $this->get('/cgv')
            ->assertRedirect('/conditions-generales');
    }
}
