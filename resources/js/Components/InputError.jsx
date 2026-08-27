export default function InputError({ message, className = '', ...props }) {
    return message ? (
        <p
            {...props}
            className={'text-sm text-neutral-600 ' + className}
        >
            {message}
        </p>
    ) : null;
}
