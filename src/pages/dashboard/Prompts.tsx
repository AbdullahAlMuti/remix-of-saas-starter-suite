import TitleGenerator from "@/components/listings/TitleGenerator";

export default function DashboardPrompts() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Title Generator</h1>
        <p className="text-muted-foreground">Generate SEO-optimized product titles using AI</p>
      </div>
      
      <TitleGenerator />
    </div>
  );
}
