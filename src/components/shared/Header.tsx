import { auth } from '@/auth';
import { HeaderClient } from './HeaderClient';

interface HeaderProps {
  hasSearch?: boolean;
}

export const Header = async ({ hasSearch = false }: HeaderProps) => {
  const session = await auth();
  const user = session?.user
    ? {
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }
    : null;

  return <HeaderClient hasSearch={hasSearch} user={user} />;
};
