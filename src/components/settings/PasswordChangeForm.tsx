import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  currentPassword: z.string().min(6, "Slaptažodis turi būti bent 6 simbolių ilgio"),
  newPassword: z.string().min(6, "Slaptažodis turi būti bent 6 simbolių ilgio"),
  confirmPassword: z.string().min(6, "Slaptažodis turi būti bent 6 simbolių ilgio"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Slaptažodžiai nesutampa",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof formSchema>;

interface PasswordChangeFormProps {
  onSubmit: (values: FormData) => Promise<void>;
}

export function PasswordChangeForm({ onSubmit }: PasswordChangeFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dabartinis slaptažodis</FormLabel>
              <FormControl>
                <Input type="password" {...field} className="bg-[#1A1D24]" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Naujas slaptažodis</FormLabel>
              <FormControl>
                <Input type="password" {...field} className="bg-[#1A1D24]" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pakartokite naują slaptažodį</FormLabel>
              <FormControl>
                <Input type="password" {...field} className="bg-[#1A1D24]" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Atnaujinti slaptažodį
        </Button>
      </form>
    </Form>
  );
}