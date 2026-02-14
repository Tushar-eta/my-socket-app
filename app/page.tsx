import Chat from "@/components/Chat";

export default function Home() {
  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ textAlign: "center", color: "#333", marginBottom: "30px" }}>
        Next.js Socket + Cron Messaging Demo
      </h1>
      <Chat />
    </div>
  );
}
