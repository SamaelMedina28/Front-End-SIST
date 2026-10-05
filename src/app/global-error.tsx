"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="es-MX"><body>
    <main style={{ fontFamily: "system-ui, sans-serif", margin: "10vh auto", maxWidth: "40rem", padding: "1.5rem" }}>
      <h1>No se pudo mostrar la aplicación</h1>
      <p>Ocurrió un problema inesperado. Intenta cargar la vista de nuevo.</p>
      <button onClick={reset} style={{ minHeight: "2.75rem", padding: "0.5rem 1rem" }} type="button">Reintentar</button>
    </main>
  </body></html>;
}
