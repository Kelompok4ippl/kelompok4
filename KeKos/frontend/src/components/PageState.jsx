import { Link } from "react-router-dom";
import Button from "./ui/Button.jsx";

// Tampilan satu halaman penuh untuk keadaan memuat / error, selalu dengan jalan kembali ke beranda
export default function PageState({ loading = false, message }) {
  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[1100px] flex-col gap-6 px-4 py-10" aria-busy="true">
        <span className="sr-only">Memuat...</span>
        <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-strong motion-reduce:animate-none" />
        <div className="h-[260px] animate-pulse rounded-[20px] bg-surface-strong motion-reduce:animate-none" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-40 animate-pulse rounded-[20px] bg-surface-strong motion-reduce:animate-none" />
          <div className="h-40 animate-pulse rounded-[20px] bg-surface-strong motion-reduce:animate-none" />
        </div>
      </main>
    );
  }
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p role="alert" className="font-poppins text-lg text-danger">{message}</p>
      <Button as={Link} to="/dashboard">
        Kembali ke beranda
      </Button>
    </main>
  );
}
