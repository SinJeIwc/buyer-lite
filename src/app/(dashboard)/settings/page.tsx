import { BackButton } from "@/components/back-button";
import { CurrenciesAddButton } from "@/components/settings/currencies/currencies-add-button";
import { CurrenciesList } from "@/components/settings/currencies-list";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <>
      <div className="flex items-center">
        <BackButton />
        <h1 className="text-2xl font-bold">Настройки</h1>
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
    </>
  );
}
