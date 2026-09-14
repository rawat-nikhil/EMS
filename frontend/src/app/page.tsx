import { Button } from "@/components/atoms/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <p className="text-xs font-medium tracking-wide text-primary uppercase">
            EMS
          </p>
          <CardTitle className="text-2xl">Employee Management</CardTitle>
          <CardDescription>
            AI-supported EMS boilerplate. Backend, MongoDB, and this Next.js UI
            are ready to build on.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Work email</Label>
            <Input id="email" type="email" placeholder="you@company.com" />
          </div>
          <Button size="lg" className="w-full">
            Continue
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
