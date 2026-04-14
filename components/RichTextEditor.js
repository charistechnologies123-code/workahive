import { useEffect, useRef } from "react";
import { EditorContent, Node, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";

const ImageNode = Node.create({
  name: "image",
  group: "block",
  draggable: true,
  selectable: true,
  addAttributes() {
    return {
      src: { default: null },
      alt: { default: "" },
    };
  },
  parseHTML() {
    return [{ tag: "img[src]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["img", HTMLAttributes];
  },
});

function MenuButton({ onClick, active, children, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={active ? "btn-primary" : "btn-soft"}
      style={{ padding: "8px 12px" }}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  disabled = false,
  onImageUpload,
}) {
  const fileInputRef = useRef(null);
  const editor = useEditor({
    editable: !disabled,
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      ImageNode,
    ],
    content: value || "<p></p>",
    editorProps: {
      attributes: {
        class: "tiptap-editor",
      },
    },
    onUpdate: ({ editor: activeEditor }) => {
      onChange(activeEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = value || "<p></p>";
    if (current !== next) {
      editor.commands.setContent(next, false);
    }
  }, [editor, value]);

  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href || "";
    const url = window.prompt("Enter URL", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const handleImageSelect = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !onImageUpload) return;

    const imageUrl = await onImageUpload(file);
    if (!imageUrl) return;

    editor
      .chain()
      .focus()
      .insertContent({
        type: "image",
        attrs: {
          src: imageUrl,
          alt: file.name,
        },
      })
      .run();
  };

  return (
    <div className="rich-editor-wrap">
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        <MenuButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}>
          Bold
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}>
          Italic
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")}>
          Underline
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })}>
          H2
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })}>
          H3
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}>
          Bullets
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")}>
          Numbered
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })}>
          Left
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })}>
          Center
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })}>
          Right
        </MenuButton>
        <MenuButton onClick={setLink} active={editor.isActive("link")}>
          Link
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().unsetLink().run()} disabled={!editor.isActive("link")}>
          Remove Link
        </MenuButton>
        {onImageUpload && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              style={{ display: "none" }}
            />
            <MenuButton onClick={() => fileInputRef.current?.click()}>
              Image
            </MenuButton>
          </>
        )}
      </div>

      <div className="rich-editor-box">
        <EditorContent editor={editor} />
      </div>

      <p className="muted small" style={{ marginTop: 8 }}>
        {placeholder || "Write here..."}
      </p>
    </div>
  );
}
