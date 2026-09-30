import { Container } from "@/components/layout/Container";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";

export function FloatingWhatsApp() {
  return (
    <div className="fixed right-0 bottom-[max(1rem,env(safe-area-inset-bottom))] left-0 z-50 lg:hidden">
      <Container>
        <WhatsAppButton
          source="floating_whatsapp"
          className="w-full shadow-[0_1rem_3rem_rgba(0,0,0,0.4)]"
        >
          Escribime por WhatsApp
        </WhatsAppButton>
      </Container>
    </div>
  );
}
