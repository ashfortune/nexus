import SubsidyDetailPage from "../components/SubsidyDetailPage";

interface Props {
    params: Promise<{
        id: string;
    }>;
}

export default async function Page({ params }: Props) {
    const { id } = await params;

    return <SubsidyDetailPage id={id} />;
}