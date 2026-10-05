export default function HomePage() {
  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="mb-4 text-3xl font-bold">EFP</h1>
      <p className="mb-6 text-gray-600">
        Sign in to open your personal dashboard and autosaved plans.
      </p>

      <div className="flex gap-3">
        <a href="/sign-in" className="rounded-xl bg-black px-4 py-2 text-white">
          Sign In
        </a>
        <a href="/sign-up" className="rounded-xl bg-gray-200 px-4 py-2 text-gray-900">
          Sign Up
        </a>
        <a href="/dashboard" className="rounded-xl bg-blue-600 px-4 py-2 text-white">
          Dashboard
        </a>
      </div>
    </main>
  );
}
