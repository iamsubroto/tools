import Link from "next/link";
import { Badge, Button, Card, Heading, Text } from "@radix-ui/themes";
import { ArrowRight, Calculator, ShieldCheck } from "lucide-react";
import { TOOLS, getLiveTools } from "@/config/tools";
import { siteConfig } from "@/config/site";

export default function HomePage() {
  const liveTools = getLiveTools();
  const upcomingTools = TOOLS.filter((t) => t.status === "planned");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Hero */}
      <section className="mb-12 max-w-3xl space-y-4">
        <Badge size="2" variant="soft" color="jade">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          100% Free • Zero Signup • Runs in Your Browser
        </Badge>
        <Heading as="h1" size={{ initial: "7", sm: "9" }} className="tracking-tight">
          {siteConfig.name} — Practical Calculators for Bangladesh &amp; NRBs
        </Heading>
        <Text as="p" size="4" color="gray" className="leading-relaxed">
          Accurate financial, tax, banking, and everyday calculators built with
          official Bangladesh rates—designed for fast mobile use in both English
          and Bangla.
        </Text>
      </section>

      {/* Live Tools */}
      <section className="mb-12 space-y-4">
        <Heading as="h2" size="5">
          Live Calculators
        </Heading>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {liveTools.map((tool) => (
            <Card
              key={tool.slug}
              size="3"
              className="flex flex-col justify-between border border-[var(--accent-7)]"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-3)] bg-[var(--accent-3)] text-[var(--accent-11)]">
                    <Calculator className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <Badge size="1" color="jade" variant="soft">
                    Live
                  </Badge>
                </div>
                <Heading as="h3" size="4">
                  {tool.titleEn}
                </Heading>
                <Text as="p" size="2" color="gray" className="leading-relaxed">
                  {tool.shortDescEn}
                </Text>
              </div>
              <div className="mt-5">
                <Button asChild size="2" color="jade" className="w-full cursor-pointer">
                  <Link href={`/${tool.slug}`}>
                    Open Calculator
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Upcoming Phase 1 Tools */}
      <section className="space-y-4">
        <Heading as="h2" size="4" color="gray">
          Next in Phase 1 Roadmap
        </Heading>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {upcomingTools.map((tool) => (
            <Card
              key={tool.slug}
              size="2"
              className="border border-[var(--gray-4)] opacity-80"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Heading as="h3" size="3">
                    {tool.titleEn}
                  </Heading>
                  <Badge size="1" color="gray" variant="soft">
                    Planned
                  </Badge>
                </div>
                <Text as="p" size="2" color="gray">
                  {tool.shortDescEn}
                </Text>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
