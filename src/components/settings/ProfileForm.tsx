import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { Profile } from "@/pages/Settings";

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.string().optional(),
});

interface ProfileFormProps {
  profile: Profile;
  isSubmitting: boolean;
  onSubmit: (values: z.infer<typeof formSchema>) => void;
}

export function ProfileForm({ profile, isSubmitting, onSubmit }: ProfileFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: profile?.email || '',
      role: profile?.role || '',
    },
  });

  console.log("Form values:", form.watch()); // Debug log

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>El. paštas</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  className="bg-[#1A1D24]"
                  required
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pareigos</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="bg-[#1A1D24]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saugoma..." : "Išsaugoti pakeitimus"}
        </Button>
      </form>
    </Form>
  );
}