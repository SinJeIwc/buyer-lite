import { Spinner } from "./spinner";

export function IsLoading() {
  return (
    <div className="flex justify-center py-8">
      <Spinner className="size-8" />
    </div>
  );
}
