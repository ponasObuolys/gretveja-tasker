import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  currentPassword: z.string().min(6, "Slaptažodis turi būti bent 6 simbolių ilgio"),
  newPassword: z.string().min(6, "Slaptažodis turi būti bent 6 simbolių ilgio"),
  confirmPassword: z.string().min(6, "Slaptažodis turi būti bent 6 simbolių ilgio"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Slaptažodžiai nesutampa",
  path: ["confirmPassword"],
});

export function SecurityForm() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.newPassword
      });

      if (error) throw error;

      toast({
        title: "Slaptažodis pakeistas",
        description: "Jūsų slaptažodis sėkmingai atnaujintas",
      });

      form.reset();
    } catch (error) {
      console.error("Error updating password:", error);
      toast({
        title: "Klaida",
        description: "Nepavyko pakeisti slaptažodžio",
        variant: "destructive",
      });
    }
  };

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