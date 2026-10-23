import { Input } from "@keystone-ui/ui";

export function Basics() {
  return (
    <div className="grid">
      <Input label="Name" placeholder="Ada Lovelace" autoComplete="name" />
      <Input label="Email" type="email" hint="Used only for sign-in." required autoComplete="email" />
    </div>
  );
}
