import Image from "next/image";
import "./dashboard-a.css";

/** Brown brand band at the top of the sign-in and code cards (the canvas's left panel, folded into the centred card). */
export function AuthBand({ image, alt, title, body }: { image: string; alt: string; title: string; body: string }) {
  return (
    <div className="da-auth-band">
      <Image src={image} alt={alt} width={96} height={96} unoptimized />
      <div>
        <strong>{title}</strong>
        <span>{body}</span>
        <span style={{ marginTop: 8, fontSize: 13 }}>Play. Earn. Roar!</span>
      </div>
    </div>
  );
}
