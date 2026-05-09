"""Improve content quality: add new countries, scenarios, and authentic prompts

Revision ID: 20260418_000005
Revises: 20260414_000004
Create Date: 2026-04-18

"""
from alembic import op
import sqlalchemy as sa
from pathlib import Path


# revision identifiers, used by Alembic.
revision = '20260418_000005'
down_revision = '20260414_000004'
branch_labels = None
depends_on = None


def load_prompt(filename: str) -> str:
    """Load prompt from prompts directory"""
    prompt_path = Path(__file__).parent.parent.parent / "prompts" / filename
    if prompt_path.exists():
        return prompt_path.read_text(encoding='utf-8')
    return f"Prompt file {filename} not found"


def upgrade() -> None:
    conn = op.get_bind()

    # Add new countries
    conn.execute(sa.text("""
        INSERT INTO countries (id, name, code, language, is_active)
        VALUES
            (3, 'Spain', 'ES', 'es', true),
            (4, 'Mexico', 'MX', 'es', true),
            (5, 'United Kingdom', 'GB', 'en', true)
        ON CONFLICT (id) DO NOTHING;
    """))

    # Update Chile scenarios with authentic prompts
    chile_airport_prompt = load_prompt("chile_airport.txt")
    chile_taxi_prompt = load_prompt("chile_taxi.txt")
    chile_free_prompt = load_prompt("chile_free.txt")

    conn.execute(
        sa.text("UPDATE scenarios SET system_prompt = :prompt WHERE id = 1"),
        {"prompt": chile_airport_prompt}
    )
    conn.execute(
        sa.text("UPDATE scenarios SET system_prompt = :prompt WHERE id = 2"),
        {"prompt": chile_taxi_prompt}
    )
    conn.execute(
        sa.text("UPDATE scenarios SET system_prompt = :prompt WHERE id = 3"),
        {"prompt": chile_free_prompt}
    )

    # Update USA scenarios with authentic prompts
    usa_immigration_prompt = load_prompt("usa_immigration.txt")
    usa_coffee_prompt = load_prompt("usa_coffee.txt")
    usa_free_prompt = load_prompt("usa_free.txt")

    conn.execute(
        sa.text("UPDATE scenarios SET system_prompt = :prompt WHERE id = 4"),
        {"prompt": usa_immigration_prompt}
    )
    conn.execute(
        sa.text("UPDATE scenarios SET system_prompt = :prompt WHERE id = 5"),
        {"prompt": usa_coffee_prompt}
    )
    conn.execute(
        sa.text("UPDATE scenarios SET system_prompt = :prompt WHERE id = 6"),
        {"prompt": usa_free_prompt}
    )

    # Add Spain scenarios
    spain_airport_prompt = load_prompt("spain_airport.txt")
    spain_tapas_prompt = load_prompt("spain_tapas.txt")
    spain_free_prompt = load_prompt("spain_free.txt")

    conn.execute(sa.text("""
        INSERT INTO scenarios (
            country_id, slug, title, description, language_code, difficulty, mode,
            system_prompt, intro_message, cultural_tip, partner_name, partner_role,
            is_active
        ) VALUES
        (
            3,
            'aeropuerto-madrid',
            'Aeropuerto de Madrid',
            'Ayuda en el aeropuerto Barajas - Terminal 4',
            'es',
            'beginner',
            'guided',
            :spain_airport,
            '¡Hola! Bienvenido al aeropuerto de Madrid. ¿En qué puedo ayudaros?',
            'In Spain, people use "vosotros" (you plural) instead of "ustedes". Listen for "vale" - it means "okay" and you''ll hear it constantly!',
            'Carmen',
            'Airport customer service',
            true
        ),
        (
            3,
            'bar-tapas-madrid',
            'Bar de tapas en Madrid',
            'Pedir tapas en un bar tradicional del barrio Malasaña',
            'es',
            'beginner',
            'guided',
            :spain_tapas,
            '¡Buenas! ¿Qué queréis tomar, tíos?',
            'Tapas culture: order small plates ("tapas") to share, move between bars ("ir de tapas"), and always use "tío/tía" casually - it''s like "dude" but Spanish!',
            'Javi',
            'Tapas bar waiter',
            true
        ),
        (
            3,
            'conversacion-libre-espana',
            'Conversación libre - España',
            'Charla informal con un madrileño',
            'es',
            'intermediate',
            'free',
            :spain_free,
            'Hola tío, ¿qué tal? ¿De dónde eres?',
            'Spaniards eat late (lunch 2-4pm, dinner 9-11pm), say "vale" constantly, and use "vosotros" - all part of authentic Castilian Spanish!',
            'Luis',
            'Local from Madrid',
            true
        )
        ON CONFLICT (slug) DO NOTHING;
    """), {
        "spain_airport": spain_airport_prompt,
        "spain_tapas": spain_tapas_prompt,
        "spain_free": spain_free_prompt
    })

    # Add Mexico scenarios
    mexico_airport_prompt = load_prompt("mexico_airport.txt")
    mexico_tacos_prompt = load_prompt("mexico_tacos.txt")
    mexico_free_prompt = load_prompt("mexico_free.txt")

    conn.execute(sa.text("""
        INSERT INTO scenarios (
            country_id, slug, title, description, language_code, difficulty, mode,
            system_prompt, intro_message, cultural_tip, partner_name, partner_role,
            is_active
        ) VALUES
        (
            4,
            'aeropuerto-ciudad-mexico',
            'Aeropuerto de Ciudad de México',
            'Ayuda en el aeropuerto internacional Benito Juárez',
            'es',
            'beginner',
            'guided',
            :mexico_airport,
            '¡Bienvenido a México! ¿En qué le puedo ayudar?',
            'Mexicans use "ustedes" (not "vosotros"), say "ahorita" (right now... or later!), and "órale" for agreement. Notice the warm, polite hospitality!',
            'María',
            'Airport service agent',
            true
        ),
        (
            4,
            'taqueria-ciudad-mexico',
            'Taquería en CDMX',
            'Pedir tacos en una taquería del barrio Roma Norte',
            'es',
            'beginner',
            'guided',
            :mexico_tacos,
            '¡Buenas noches! ¿Qué van a ordenar?',
            'Mexican tacos are different from Tex-Mex! Corn tortillas, fresh cilantro and onion, and always with lime. Try "al pastor" - it''s the specialty!',
            'Don Roberto',
            'Taquería owner',
            true
        ),
        (
            4,
            'conversacion-libre-mexico',
            'Conversación libre - México',
            'Charla informal con una chilanga (persona de CDMX)',
            'es',
            'intermediate',
            'free',
            :mexico_free,
            '¡Hola! ¿De dónde eres?',
            'Mexican Spanish is melodic and warm. Listen for "güey" (dude), "qué padre" (cool), and "no manches" (no way!). Time is flexible - "ahorita" can mean now or later!',
            'Daniela',
            'Designer from Mexico City',
            true
        )
        ON CONFLICT (slug) DO NOTHING;
    """), {
        "mexico_airport": mexico_airport_prompt,
        "mexico_tacos": mexico_tacos_prompt,
        "mexico_free": mexico_free_prompt
    })

    # Add UK scenarios
    uk_airport_prompt = load_prompt("uk_airport.txt")
    uk_pub_prompt = load_prompt("uk_pub.txt")
    uk_free_prompt = load_prompt("uk_free.txt")

    conn.execute(sa.text("""
        INSERT INTO scenarios (
            country_id, slug, title, description, language_code, difficulty, mode,
            system_prompt, intro_message, cultural_tip, partner_name, partner_role,
            is_active
        ) VALUES
        (
            5,
            'heathrow-airport',
            'Heathrow Airport',
            'Getting help at London Heathrow Terminal 5',
            'en',
            'beginner',
            'guided',
            :uk_airport,
            'Hello! How can I help you today?',
            'British English: "queue" not "line", "tube" not "subway", "brilliant" means great. They apologize constantly and use understatement - "not bad" means really good!',
            'Sarah',
            'Airport customer service',
            true
        ),
        (
            5,
            'pub-london',
            'Traditional London Pub',
            'Ordering drinks and food at a pub in Shoreditch',
            'en',
            'beginner',
            'guided',
            :uk_pub,
            'Alright mate? What can I get ya?',
            'Pub culture: order at the bar (no table service), buy "rounds" for friends, a "pint" is the standard size. Say "cheers" for thanks, and call everyone "mate"!',
            'Tom',
            'Pub bartender',
            true
        ),
        (
            5,
            'free-talk-uk',
            'Free Talk - UK',
            'Casual conversation with a Londoner',
            'en',
            'intermediate',
            'free',
            :uk_free,
            'Hiya! Where are you from originally?',
            'British communication: lots of understatement ("quite expensive" = very expensive), self-deprecating humor, and saying "not bad" when things are great. Master "mate" and "brilliant"!',
            'Emma',
            'Social media manager from London',
            true
        )
        ON CONFLICT (slug) DO NOTHING;
    """), {
        "uk_airport": uk_airport_prompt,
        "uk_pub": uk_pub_prompt,
        "uk_free": uk_free_prompt
    })


def downgrade() -> None:
    conn = op.get_bind()

    # Remove new scenarios
    conn.execute(sa.text("""
        DELETE FROM scenarios WHERE country_id IN (3, 4, 5);
    """))

    # Remove new countries
    conn.execute(sa.text("""
        DELETE FROM countries WHERE id IN (3, 4, 5);
    """))

    # Restore old basic prompts for Chile/USA (simplified versions)
    conn.execute(sa.text("""
        UPDATE scenarios SET system_prompt = 'You are a friendly Chilean local helping a learner at Santiago airport.' WHERE id = 1;
        UPDATE scenarios SET system_prompt = 'You are a Chilean driver having a natural conversation with a learner.' WHERE id = 2;
        UPDATE scenarios SET system_prompt = 'You are a friendly Chilean conversation partner.' WHERE id = 3;
        UPDATE scenarios SET system_prompt = 'You are a US immigration officer talking to a language learner entering the country.' WHERE id = 4;
        UPDATE scenarios SET system_prompt = 'You are a barista in the US having a friendly exchange with a learner.' WHERE id = 5;
        UPDATE scenarios SET system_prompt = 'You are a friendly American conversation partner.' WHERE id = 6;
    """))
