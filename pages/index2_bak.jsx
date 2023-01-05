import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Icon,
  useColorMode,
} from "@chakra-ui/react";
import Head from "next/head";
import { BsFillMoonStarsFill, BsFillSunFill } from "react-icons/bs";
import { WalletSection } from "../components";
import ScrollableSectionContainer from "../components/ScrollableSectionContainer";
import StakedToken from "../views/StakedToken";

export default function Home() {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <ScrollableSectionContainer>
      <Container maxW="5xl" py={10}>
        <Head>
          <title>MantleWallet</title>
          <meta name="description" content="Generated by create cosmos app" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <Flex justifyContent="end" mb={4}>
          <Button variant="outline" px={0} onClick={toggleColorMode}>
            <Icon
              as={colorMode === "light" ? BsFillMoonStarsFill : BsFillSunFill}
            />
          </Button>
        </Flex>
        <Box textAlign="center">
          <Heading
            as="h1"
            fontSize={{ base: "3xl", sm: "4xl", md: "5xl" }}
            fontWeight="extrabold"
            mb={3}
          >
            MantleWallet
          </Heading>
        </Box>
        <WalletSection />
        <StakedToken />
      </Container>
    </ScrollableSectionContainer>
  );
}
