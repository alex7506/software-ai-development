# Instalar `ai-dev`

## Requisitos
- Node.js 20 o superior (`node -v`).
- Git (recomendado: sin Git no hay trazabilidad de commits).

## Instalación
La herramienta se instala desde su repositorio público:

```bash
git clone https://github.com/alex7506/software-ai-development.git
cd software-ai-development/cli
npm ci
npm run build
npm link
```

`npm link` deja el comando `ai-dev` disponible en cualquier carpeta. Instalado así, usa la metodología del repositorio clonado.

Para fijar una versión concreta, cambia a su etiqueta antes de compilar (por ejemplo `git checkout v1.1.0`). Las versiones publicadas están en [Releases](https://github.com/alex7506/software-ai-development/releases).

## Actualizar
```bash
cd software-ai-development
git pull
cd cli && npm ci && npm run build
```

Tus proyectos no se actualizan solos: cada uno fija la versión de la metodología que usa. Ver `ai-dev doctor`.

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

## Licencia
Puedes usar la herramienta gratis, también en proyectos comerciales, y adaptarla para uso interno. No se permite distribuir versiones modificadas. Todo lo que crees con ella es tuyo. Texto completo: [LICENSE](https://github.com/alex7506/software-ai-development/blob/main/LICENSE).

## Siguiente
[Iniciar un proyecto](iniciar-proyecto.md) o seguir el [tutorial](../tutorial/primer-proyecto.md).
