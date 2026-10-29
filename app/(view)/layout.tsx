import Link from "next/link";
import { auth } from "@/auth";

import BrandLogo from "../ui/brand-logo";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { LogOut } from "lucide-react";
import { Suspense } from "react";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh flex-col">
      <header className="shrink-0 bg-blue-100">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="w-36 md:w-40">
            <BrandLogo />
          </div>
          <div>
            <Suspense fallback={<div className="h-10 w-40" />}>
              <UserDropDown />
            </Suspense>
          </div>
        </div>
      </header>
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-3 sm:px-6 sm:py-4 lg:px-8 lg:py-6">
        <Suspense fallback={<p>Memuat...</p>}>{children}</Suspense>
      </main>
    </div>
  );
}

// Komponen mandiri, ambil session sendiri di dalam
async function UserDropDown() {
  const session = await auth();

  if (!session?.user) {
    return (
      <Button variant="outline">
        <Link href="/login">Sign In</Link>
      </Button>
    );
  }

  const { email, fullname } = session.user;
  const initials = fullname ? fullname.slice(0, 2).toUpperCase() : "UN";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Item className="cursor-pointer bg-gray-50" size="xs">
          <ItemMedia variant="icon" className="grid place-items-center">
            <Avatar>
              <AvatarFallback className="text-sm">{initials}</AvatarFallback>
            </Avatar>
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{fullname ?? "User"}</ItemTitle>
            <ItemDescription>{email}</ItemDescription>
          </ItemContent>
        </Item>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem>Profile</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive">
            <Link href={"/logout"} className="w-full flex gap-2 items-center">
              <span>
                <LogOut />
              </span>
              <span>Logout</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
