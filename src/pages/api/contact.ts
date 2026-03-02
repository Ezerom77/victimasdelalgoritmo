import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { nombre_alias, email, link_hallazgo, manifiesto_razon } = body;

    // Basic validation
    if (!nombre_alias || !email || !link_hallazgo || !manifiesto_razon) {
      return new Response(
        JSON.stringify({ error: "Todos los campos son obligatorios" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Insert into Supabase
    const { error } = await supabase
      .from("contactos_hallazgos")
      .insert([
        {
          nombre_alias,
          email,
          link_hallazgo,
          manifiesto_razon,
        },
      ]);

    if (error) {
      console.error("Supabase error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ message: "Hallazgo archivado correctamente" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("Server error:", e);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
