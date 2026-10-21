import Image from "next/image";

export default function BrandLogo() {
  return (
    <Image
      width={871}
      height={155}
      src={"/brand-logo.avif"}
      alt="brand-logo"
      priority
    />
  );
}
