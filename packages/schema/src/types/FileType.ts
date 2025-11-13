import * as $ from "./utils.js";

export type FileTypeOptions = $.TypeOptions<{
  ext?: string[];
  min?: FileSize;
  max?: FileSize;
}>;

type FileSize = number | `${number}mb`;

const type = "file" as const;

export class MinimalFileType<
  F extends $.TypeFlag.Options = {},
> extends $.MinimalType<File, F, typeof type> {
  override readonly kind = type;
}

export class FileType<F extends $.TypeFlag.Options = {}> extends $.Type<
  File,
  F,
  typeof type,
  FileTypeOptions
> {
  static {
    $.kind(this, "FileType");
  }
  override readonly kind = type;
  declare nullable: () => FileType<$.TypeFlag.Nullable<F>>;
  declare optional: () => FileType<$.TypeFlag.Optional<F>>;
  declare nullish: () => FileType<$.TypeFlag.Nullish<F>>;
  declare required: () => FileType<$.TypeFlag.Required<F>>;
  declare flags: <F2 extends $.SchemaFlags>(
    flags: F2,
  ) => FileType<$.TypeFlag.Merge<F, F2>>;
  protected override onValidate(
    value: $.TypeDef<this>,
    context: $.TypeContext,
  ) {
    const val = this.validation<"min" | "max">(value, context);
    if (!val.next()) return val.errors;
    if (!(value instanceof File)) return val.addTypeError("File");
    const { options } = this;
    if (options.min) {
      const min = parseSize(options.min);
      if (value.size > min) return val.add("min");
    }
    if (options.max) {
      const max = parseSize(options.max);
      if (value.size > max) return val.add("max");
    }
    return val.end();
  }
  protected override onJsonSchema(): $.JSONSchema7 {
    return {
      type: ["boolean", ...(this.options.nullable ? ["null" as const] : [])],
    };
  }
  protected validateMaxSize(size: number) {
    if (this.options.max) {
      const max = parseSize(this.options.max);
      if (size > max) return false;
    }
    return true;
  }
  min(value: FileSize | undefined): this {
    return this.clone({ min: value });
  }
  max(value: FileSize | undefined): this {
    return this.clone({ max: value });
  }
  ext(value: string[] | string | undefined): this {
    return this.clone({ ext: typeof value === "string" ? [value] : value });
  }
}

function parseSize(size: FileSize) {
  if (typeof size === "number") return size;
  if (!/^\d+mb$/.test(size)) throw new Error(`Invalid file size: ${size}`);
  return Number(size.slice(0, size.length - 2)) * Math.pow(1024, 2);
}
