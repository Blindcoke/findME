// components/AddCaptiveForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "../lib/utils";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useState } from "react";
import { csrfToken } from "../csrf";
import { useLocation } from "react-router-dom";

interface AddCaptiveFormProps {
  formType?: 'informed' | 'searching' | 'archive';
}

const statusEnum = z.enum(['informed', 'searching', 'deceased', 'reunited']);

const formSchema = z.object({
  name: z.string().optional(),
  picture: z.instanceof(File).optional(),
  person_type: z.enum(["military", "civilian"]),
  brigade: z.string().optional(),
  date_of_birth: z.date().optional(),
  region: z.string().optional(),
  settlement: z.string().optional(),
  circumstances: z.string().optional(),
  appearance: z.string().optional(),
  status: statusEnum,
});

const formatDate = (date: Date | undefined) => date ? format(date, 'yyyy-MM-dd') : undefined;

export function AddCaptiveForm({ formType: propFormType }: AddCaptiveFormProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine form type from props or URL path
  const pathContext = location.pathname.includes('informated') 
    ? 'informed' 
    : location.pathname.includes('searching') 
    ? 'searching' 
    : location.pathname.includes('archive') 
    ? 'archive' 
    : 'informed';

  const formType = propFormType ?? pathContext;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      person_type: "civilian",
      status: formType === 'archive' ? undefined : formType,
    },
  });

  const personType = form.watch("person_type");
  const circumstancesLabel = {
    informed: 'Обставини за яких було отримано інформацію',
    searching: 'Обставини за яких людина зникла',
    archive: 'Обставини загибелі або возз’єднання'
  }[formType];

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true);
      const formData = new FormData();

      Object.entries(values).forEach(([key, value]) => {
        if (key === "date_of_birth") {
          const formattedDate = formatDate(value as Date);
          if (formattedDate) formData.append(key, formattedDate);
        } else if (value) {
          formData.append(key, value instanceof File ? value : value.toString());
        }
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/captives/`, {
        method: "POST",
        headers: { "X-CSRFToken": csrfToken },
        body: formData,
        credentials: "include",
      });

      if (!response.ok) throw new Error('Submission failed');
      
      navigate({
        informed: "/informated",
        searching: "/searching",
        archive: "/archive"
      }[formType]);
    } catch (err) {
      console.log(err);
      setError("Не вдалося відправити форму. Будь ласка, спробуйте ще раз.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-emerald-100 mb-8">
        {{
          informed: 'Надіслати інформацію про особу',
          searching: 'Зареєструвати зниклу особу',
          archive: 'Додати особу до архіву'
        }[formType]}
      </h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {formType !== 'archive' && (
            <input type="hidden" {...form.register('status')} />
          )}

          {formType === 'archive' && (
            <div className="bg-emerald-900/30 backdrop-blur-lg rounded-2xl p-6 shadow-xl space-y-6">
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-emerald-300">Статус</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-emerald-800/20 border-2 border-emerald-600 text-emerald-100">
                        <SelectValue placeholder="Оберіть статус" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-emerald-800/80 backdrop-blur-lg border-2 border-emerald-600">
                      <SelectItem value="deceased" className="hover:bg-emerald-700/50 text-white">
                        Загиблий
                      </SelectItem>
                      <SelectItem value="reunited" className="hover:bg-emerald-700/50 text-white">
                        Возз’єднаний
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}/>
            </div>
          )}

          {/* Personal Information Section */}
          <div className="bg-emerald-900/30 backdrop-blur-lg rounded-2xl p-6 shadow-xl space-y-6">
            <h2 className="text-xl font-semibold text-emerald-200">Основна інформація</h2>

            <FormField control={form.control} name="picture" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-emerald-300">Фото</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    onChange={(e) => field.onChange(e.target.files?.[0])}
                    className="bg-emerald-800/20 border-2 border-emerald-600 text-emerald-100 file:text-emerald-100"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-emerald-300">Ім'я</FormLabel>
                <FormControl>
                  <Input {...field} className="bg-emerald-800/20 border-2 border-emerald-600 text-emerald-100" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="person_type" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-emerald-300">Тип особи</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-emerald-800/20 border-2 border-emerald-600 text-emerald-100">
                      <SelectValue placeholder="Оберіть тип особи" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-emerald-800/80 backdrop-blur-lg border-2 border-emerald-600">
                    <SelectItem value="military" className="hover:bg-emerald-700/50 text-white">Військовий</SelectItem>
                    <SelectItem value="civilian" className="hover:bg-emerald-700/50 text-white">Цивільний</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            {personType === 'military' && (
              <FormField control={form.control} name="brigade" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-emerald-300">Бригада</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-emerald-800/20 border-2 border-emerald-600 text-emerald-100" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}
          </div>

          {/* Details Section */}
          <div className="bg-emerald-900/30 backdrop-blur-lg rounded-2xl p-6 shadow-xl space-y-6">
            <h2 className="text-xl font-semibold text-emerald-200">Деталі</h2>

            <FormField control={form.control} name="date_of_birth" render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-emerald-300">Дата народження</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "bg-emerald-800/20 border-2 border-emerald-600 text-emerald-100 hover:bg-emerald-700/30 hover:border-yellow-500",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "dd.MM.yyyy") : <span className="text-yellow-500">Оберіть дату</span>}
                        <CalendarIcon className="ml-2 h-4 w-4 text-emerald-300" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="bg-emerald-800/80 backdrop-blur-lg border-2 border-emerald-600 w-auto p-0">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="region" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-emerald-300">Область</FormLabel>
                <FormControl>
                  <Input {...field} className="bg-emerald-800/20 border-2 border-emerald-600 text-emerald-100" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="settlement" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-emerald-300">Населений пункт</FormLabel>
                <FormControl>
                  <Input {...field} className="bg-emerald-800/20 border-2 border-emerald-600 text-emerald-100" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          {/* Additional Information Section */}
          <div className="bg-emerald-900/30 backdrop-blur-lg rounded-2xl p-6 shadow-xl space-y-6">
            <h2 className="text-xl font-semibold text-emerald-200">Додаткова інформація</h2>

            <FormField control={form.control} name="circumstances" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-emerald-300">{circumstancesLabel}</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    className="bg-emerald-800/20 border-2 border-emerald-600 text-emerald-100 min-h-[100px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="appearance" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-emerald-300">Опис зовнішності</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    className="bg-emerald-800/20 border-2 border-emerald-600 text-emerald-100 min-h-[100px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          {error && <div className="text-red-400 text-center">{error}</div>}

          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              onClick={() => navigate(-1)}
              className="bg-gradient-to-r from-green-500 to-yellow-600 hover:from-green-400 hover:to-yellow-500 border-emerald-600 text-emerald-100 border-0"
            >
              Скасувати
            </Button>
            <Button
              type="submit"
              className={cn(
                "bg-gradient-to-r text-white  border-0",
                formType === 'informed' ? "from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500" :
                formType === 'searching' ? "from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500" :
                "from-blue-600 to-teal-600 hover:from-blue-500 hover:to-teal-500"
              )}
              disabled={loading}
            >
              {loading ? "Збереження..." : {
                informed: "Надіслати інформацію",
                searching: "Зареєструвати зниклу особу",
                archive: "Додати до архіву"
              }[formType]}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
export default AddCaptiveForm;