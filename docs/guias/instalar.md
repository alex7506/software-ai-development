# Instalar `ai-dev`

## Requisitos
- Node.js 20 o superior (`node -v`).
- Git (recomendado: sin Git no hay trazabilidad de commits).
- Acceso al repositorio de la metodología.

## Instalación (uso privado)
Mientras la herramienta no se publique, se instala desde el repositorio:

```bash
git clone https://github.com/alex7506/software-ai-development.git
cd software-ai-development/cli
npm ci
npm run build
npm link
```

`npm link` deja el comando `ai-dev` disponible en cualquier carpeta. Instalado así, usa la metodología del repositorio clonado: un `git pull` seguido de `npm run build` la actualiza.

## Comprobar la instalación
```bash
ai-dev --version
ai-dev doctor
```

`doctor` revisa Node, Git y, si estás dentro de un proyecto, que la versión fijada coincida con la de la CLI y que `ai-dev validate` no tenga errores.

## Desinstalar
```bash
cd software-ai-development/cli
npm unlink -g ai-dev
```

## Siguiente
[Iniciar un proyecto](iniciar-proyecto.md)
