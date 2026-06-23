import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { useEffect, useRef } from 'react';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Code, FileCode2, List, ListOrdered, Quote, Link2, Unlink, ImagePlus,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { uploadApi } from '../../lib/api';
import toast from 'react-hot-toast';

const isEmpty = (html) => !html || html === '<p></p>' || html.trim() === '<p></p>';

function ToolbarBtn({ onClick, active, title, children }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={cn(
        'p-1.5 rounded transition-colors',
        active ? 'bg-brand-100 text-brand-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700',
      )}
    >
      {children}
    </button>
  );
}

const Divider = () => <div className="w-px h-4 bg-gray-200 self-center mx-0.5" />;

export default function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Start writing…',
  error,
  label,
  required,
  hint,
}) {
  const imageInputRef = useRef(null);
  const skipSyncRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder }),
      Image.configure({ inline: false, HTMLAttributes: { class: 'rounded-md max-w-full' } }),
      Link.configure({ openOnClick: false, HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' } }),
    ],
    content: value || '',
    onUpdate({ editor }) {
      skipSyncRef.current = true;
      onChange(editor.getHTML());
    },
  });

  // Sync external value changes (e.g. form reset loading saved content)
  useEffect(() => {
    if (!editor || skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }
    const newHtml = value || '';
    const editorHtml = editor.getHTML();
    if (isEmpty(newHtml) && isEmpty(editorHtml)) return;
    if (newHtml !== editorHtml) {
      editor.commands.setContent(newHtml, false);
    }
  }, [editor, value]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    try {
      const { url } = await uploadApi.image(file, 'campaigns');
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
    } catch {
      toast.error('Image upload failed.');
    }
    e.target.value = '';
  };

  const handleLink = () => {
    if (!editor) return;
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt('Enter URL:');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-[#001E2B]">
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}

      <div className={cn(
        'border rounded-md overflow-hidden bg-white transition-colors',
        error ? 'border-red-400' : 'border-gray-200 focus-within:border-brand-400',
      )}>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 px-1.5 py-1 border-b border-gray-100 bg-gray-50">
          <ToolbarBtn title="Bold" active={editor?.isActive('bold')}
            onClick={() => editor?.chain().focus().toggleBold().run()}>
            <Bold size={14} />
          </ToolbarBtn>
          <ToolbarBtn title="Italic" active={editor?.isActive('italic')}
            onClick={() => editor?.chain().focus().toggleItalic().run()}>
            <Italic size={14} />
          </ToolbarBtn>
          <ToolbarBtn title="Underline" active={editor?.isActive('underline')}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}>
            <UnderlineIcon size={14} />
          </ToolbarBtn>
          <ToolbarBtn title="Strikethrough" active={editor?.isActive('strike')}
            onClick={() => editor?.chain().focus().toggleStrike().run()}>
            <Strikethrough size={14} />
          </ToolbarBtn>

          <Divider />

          <ToolbarBtn title="Inline code" active={editor?.isActive('code')}
            onClick={() => editor?.chain().focus().toggleCode().run()}>
            <Code size={14} />
          </ToolbarBtn>
          <ToolbarBtn title="Code block" active={editor?.isActive('codeBlock')}
            onClick={() => editor?.chain().focus().toggleCodeBlock().run()}>
            <FileCode2 size={14} />
          </ToolbarBtn>

          <Divider />

          <ToolbarBtn title="Bullet list" active={editor?.isActive('bulletList')}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}>
            <List size={14} />
          </ToolbarBtn>
          <ToolbarBtn title="Numbered list" active={editor?.isActive('orderedList')}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
            <ListOrdered size={14} />
          </ToolbarBtn>

          <Divider />

          <ToolbarBtn title="Blockquote" active={editor?.isActive('blockquote')}
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}>
            <Quote size={14} />
          </ToolbarBtn>

          <Divider />

          <ToolbarBtn
            title={editor?.isActive('link') ? 'Remove link' : 'Add link'}
            active={editor?.isActive('link')}
            onClick={handleLink}
          >
            {editor?.isActive('link') ? <Unlink size={14} /> : <Link2 size={14} />}
          </ToolbarBtn>

          <ToolbarBtn title="Insert image" active={false} onClick={() => imageInputRef.current?.click()}>
            <ImagePlus size={14} />
          </ToolbarBtn>
          <input ref={imageInputRef} type="file" accept="image/*" className="sr-only" onChange={handleImageUpload} />
        </div>

        {/* Editor — fixed height, scrolls when content overflows */}
        <div className="h-[220px] overflow-y-auto">
          <EditorContent editor={editor} />
        </div>
      </div>

      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
