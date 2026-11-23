export function enlaceWhatsapp(telefono: string | null | undefined, mensaje = ''): string | null {
  let numero = (telefono ?? '').replace(/\D/g, '');
  if (numero.startsWith('00')) numero = numero.slice(2);

  if (numero.startsWith('54')) {
    if (!numero.startsWith('549')) numero = '549' + numero.slice(2);
  } else {
    numero = '549' + numero.replace(/^0/, '');
  }

  // 549 + 10 dígitos (código de área + número, sin 0 ni 15)
  if (numero.length !== 13) return null;

  const texto = mensaje ? `?text=${encodeURIComponent(mensaje)}` : '';
  return `https://wa.me/${numero}${texto}`;
}