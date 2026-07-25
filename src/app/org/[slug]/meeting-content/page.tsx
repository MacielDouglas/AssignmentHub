import { redirect } from "next/navigation";

type Props = {
	params: Promise<{ slug: string }>;
};

export default async function MeetingContentIndexPage({ params }: Props) {
	const { slug } = await params;
	redirect(`/org/${slug}/meeting-content/apostila`);
}
