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
import { submitCaptiveForm } from "../config/api";
import { Card, CardContent } from "./ui/card";

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
  appearance: z.string().min(1, { message: "Опис зовнішності обов'язковий" }),
  status: statusEnum,
});

const formatDate = (date: Date): string | null => date ? format(date, 'yyyy-MM-dd') : null;

export function AddCaptiveForm({ formType: propFormType }: AddCaptiveFormProps) {
  const navigate = useNavigate();
  const location = useLocation();

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
  const [picturePreview, setPicturePreview] = useState<string | null>(null);
  
  // Example placeholder text for appearance field
  const appearancePlaceholder = "Опишіть зовнішність людини українською мовою. Надайте короткий опис: вік, стать, волосся, очі, обличчя.";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      person_type: "civilian",
      status: formType === 'archive' ? undefined : formType,
      appearance: "",
    },
  });

  const personType = form.watch("person_type");
  const circumstancesLabel = {
    informed: 'Обставини за яких було отримано інформацію',
    searching: 'Обставини за яких людина зникла',
    archive: "Обставини загибелі або возз'єднання"
  }[formType];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      form.setValue("picture", file);
      
      const previewUrl = URL.createObjectURL(file);
      setPicturePreview(previewUrl);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
  
    const result = await submitCaptiveForm(values, csrfToken, formatDate, formType);
  
    if (result.success && result.redirectPath) {
      navigate(result.redirectPath);
    } else {
      setError(result.error || "Помилка під час відправлення форми");
    }
  
    setLoading(false);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Button
        onClick={() => navigate(-1)}
        className="mb-6 bg-emerald-700 hover:bg-emerald-600 text-white border-0"
      >
        Назад
      </Button>

      <Card className="bg-emerald-900/50 backdrop-blur-lg border-2 border-emerald-700 rounded-2xl">
        <CardContent className="p-8">
          <h1 className="text-3xl font-bold text-emerald-100 mb-6">
            {{
              informed: 'Надіслати інформацію про особу',
              searching: 'Зареєструвати зниклу особу',
              archive: 'Додати особу до архіву'
            }[formType]}
          </h1>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {formType !== 'archive' && (
                <input type="hidden" {...form.register('status')} />
              )}

              {formType === 'archive' && (
                <div className="mb-6">
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-sm font-medium text-emerald-200 mb-1">Статус</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-emerald-800/50 border-emerald-600 text-emerald-100">
                            <SelectValue placeholder="Оберіть статус" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-emerald-800 border-emerald-600">
                          <SelectItem value="deceased" className="text-emerald-100">Загиблий</SelectItem>
                          <SelectItem value="reunited" className="text-emerald-100">Возз'єднаний</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}/>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {/* Left Column */}
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-sm font-medium text-emerald-200 mb-1">Ім'я та прізвище</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="bg-emerald-800/50 border-emerald-600 text-emerald-100 placeholder:text-emerald-400" 
                          placeholder="Введіть ім'я та прізвище особи"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div>
                    <label htmlFor="picture" className="block text-sm font-medium text-emerald-200 mb-1">Фото</label>
                    <Input
                      id="picture"
                      type="file"
                      onChange={handleFileChange}
                      className="bg-emerald-800/50 border-emerald-600 text-emerald-100 file:text-emerald-100"
                    />
                    {picturePreview && (
                      <div className="mt-2">
                        <img 
                          src={picturePreview} 
                          alt="Попередній перегляд" 
                          className="max-h-32 rounded-md border border-emerald-600" 
                        />
                      </div>
                    )}
                  </div>

                  <FormField control={form.control} name="person_type" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-sm font-medium text-emerald-200 mb-1">Тип особи</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-emerald-800/50 border-emerald-600 text-emerald-100">
                            <SelectValue placeholder="Оберіть тип особи" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-emerald-800 border-emerald-600">
                          <SelectItem value="military" className="text-emerald-100">Військовий</SelectItem>
                          <SelectItem value="civilian" className="text-emerald-100">Цивільний</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {personType === 'military' && (
                    <FormField control={form.control} name="brigade" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="block text-sm font-medium text-emerald-200 mb-1">Бригада / Підрозділ</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            className="bg-emerald-800/50 border-emerald-600 text-emerald-100 placeholder:text-emerald-400" 
                            placeholder="Введіть бригаду або підрозділ"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  )}
                </div>

                <div className="space-y-4">
                  {/* Right Column */}
                  <FormField control={form.control} name="region" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-sm font-medium text-emerald-200 mb-1">Область</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="bg-emerald-800/50 border-emerald-600 text-emerald-100 placeholder:text-emerald-400" 
                          placeholder="Введіть область"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="settlement" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-sm font-medium text-emerald-200 mb-1">Населений пункт</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="bg-emerald-800/50 border-emerald-600 text-emerald-100 placeholder:text-emerald-400" 
                          placeholder="Введіть населений пункт"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="date_of_birth" render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="block text-sm font-medium text-emerald-200 mb-1">Дата народження</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "bg-emerald-800/50 border-emerald-600 text-emerald-100 hover:bg-emerald-700/50",
                                !field.value && "text-emerald-400"
                              )}
                            >
                              {field.value ? format(field.value, "dd.MM.yyyy") : <span>Оберіть дату</span>}
                              <CalendarIcon className="ml-2 h-4 w-4 text-emerald-300" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="bg-emerald-800/80 backdrop-blur-lg border-2 border-emerald-600 w-auto p-0">
                          <Calendar 
                            mode="single" 
                            selected={field.value} 
                            onSelect={field.onChange} 
                            initialFocus 
                            className="text-emerald-100" 
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              <FormField control={form.control} name="appearance" render={({ field }) => (
                <FormItem>
                  <FormLabel className="block text-sm font-medium text-emerald-200 mb-1">
                    Опис зовнішності
                    <span className="ml-1 text-red-400">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={appearancePlaceholder}
                      className="bg-emerald-800/50 border-emerald-600 text-emerald-100 placeholder:text-emerald-400 min-h-32"
                    />
                  </FormControl>
                  <p className="text-xs text-emerald-400 mt-1">
                    Приклад: "Чоловік, 45 років, темне коротке волосся з сивиною, карі очі, овальне обличчя з вусами."
                  </p>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="circumstances" render={({ field }) => (
                <FormItem>
                  <FormLabel className="block text-sm font-medium text-emerald-200 mb-1">{circumstancesLabel}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="bg-emerald-800/50 border-emerald-600 text-emerald-100 placeholder:text-emerald-400 min-h-32"
                      placeholder="Опишіть обставини..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {error && <div className="text-red-400 text-center">{error}</div>}

              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="bg-slate-700 hover:bg-slate-600 text-white border-0"
                  disabled={loading}
                >
                  Скасувати
                </Button>
                <Button
                  type="submit"
                  className={cn(
                    "text-white border-0",
                    formType === 'informed' ? "bg-emerald-600 hover:bg-emerald-500" :
                    formType === 'searching' ? "bg-emerald-600 hover:bg-emerald-500" :
                    "bg-emerald-600 hover:bg-emerald-500"
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
        </CardContent>
      </Card>
    </div>
  );
}

export default AddCaptiveForm;