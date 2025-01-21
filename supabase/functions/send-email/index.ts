import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: "new_task" | "task_completed";
  taskId: string;
}

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

const getTaskDetails = async (taskId: string) => {
  const { data: task, error } = await supabase
    .from("tasks")
    .select(`
      *,
      created_by_profile:profiles!tasks_created_by_fkey(email)
    `)
    .eq("id", taskId)
    .single();

  if (error) throw error;
  return task;
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("lt-LT", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const createEmailContent = (type: "new_task" | "task_completed", task: any) => {
  const taskUrl = `${Deno.env.get("SITE_URL") || "http://localhost:5173"}/tasks/${task.id}`;
  const deadline = task.deadline ? formatDate(task.deadline) : "Nenustatyta";

  if (type === "new_task") {
    return {
      to: ["aurimasb@gretveja.lt"],
      subject: "Nauja užduotis sukurta",
      html: `
        <h2>Nauja užduotis: ${task.title}</h2>
        <p><strong>Aprašymas:</strong> ${task.description || "Nėra aprašymo"}</p>
        <p><strong>Terminas:</strong> ${deadline}</p>
        <p><strong>Prioritetas:</strong> ${task.priority}</p>
        <p><strong>Sukūrė:</strong> ${task.created_by_profile?.email}</p>
        <p><a href="${taskUrl}">Peržiūrėti užduotį</a></p>
      `,
    };
  } else {
    return {
      to: [task.created_by_profile?.email],
      subject: "Užduotis įvykdyta",
      html: `
        <h2>Užduotis įvykdyta: ${task.title}</h2>
        <p><strong>Aprašymas:</strong> ${task.description || "Nėra aprašymo"}</p>
        <p><strong>Terminas:</strong> ${deadline}</p>
        <p><strong>Būsena:</strong> ${task.status}</p>
        <p><a href="${taskUrl}">Peržiūrėti užduotį</a></p>
      `,
    };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, taskId }: EmailRequest = await req.json();
    console.log(`Processing ${type} email notification for task ${taskId}`);

    const task = await getTaskDetails(taskId);
    console.log("Task details retrieved:", task);

    // Check notification preferences
    if (type === "task_completed") {
      const { data: creatorProfile } = await supabase
        .from("profiles")
        .select("notify_new_tasks")
        .eq("id", task.created_by)
        .single();

      if (!creatorProfile?.notify_new_tasks) {
        console.log("Creator has disabled task notifications");
        return new Response(
          JSON.stringify({ message: "Notification skipped - user preference" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }
    }

    const emailContent = createEmailContent(type, task);
    console.log("Sending email to:", emailContent.to);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Gretveja Tasker <tasker@gretveja.lt>",
        ...emailContent,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Failed to send email: ${error}`);
    }

    const data = await res.json();
    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
};

serve(handler);