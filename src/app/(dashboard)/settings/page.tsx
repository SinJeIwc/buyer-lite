import { CurrenciesAddButton } from "@/components/settings/currencies/currencies-add-button";
import { CurrenciesList } from "@/components/settings/currencies-list";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Настройки</h1>
        <p className="text-muted-foreground">
          Управление справочниками и настройками приложения
        </p>
      </div>

      {/* Тема */}
      <Card>
        <CardHeader>
          <CardTitle>Выберите тему приложения</CardTitle>
        </CardHeader>
        <CardContent>
          <ThemeToggle />
        </CardContent>
      </Card>

      {/* Валюты */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Валюты</CardTitle>
          <CurrenciesAddButton />
        </CardHeader>
        <CardContent>
          <CurrenciesList />
        </CardContent>
      </Card>
    </div>
  );
}
