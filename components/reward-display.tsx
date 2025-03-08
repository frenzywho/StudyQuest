"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Trophy, BookOpen, Paintbrush, CreditCard, CheckCircle } from "lucide-react"

// Reward interface
interface Reward {
  id: string
  name: string
  description: string
  pointsCost: number
  category: "GiftCards" | "Educational" | "Customization" | "Achievements"
  image: string
  available: boolean
}

// Mock rewards
const mockRewards: Reward[] = [
  {
    id: "r1",
    name: "$5 Amazon Gift Card",
    description: "Redeem for a $5 Amazon gift card to spend online",
    pointsCost: 500,
    category: "GiftCards",
    image: "/placeholder.svg?height=100&width=100",
    available: true,
  },
  {
    id: "r2",
    name: "$10 Steam Gift Card",
    description: "Get a $10 credit for games on Steam",
    pointsCost: 950,
    category: "GiftCards",
    image: "/placeholder.svg?height=100&width=100",
    available: true,
  },
  {
    id: "r3",
    name: "Premium Study Guide",
    description: "Unlock premium study materials for your courses",
    pointsCost: 300,
    category: "Educational",
    image: "/placeholder.svg?height=100&width=100",
    available: true,
  },
  {
    id: "r4",
    name: "Custom Avatar Pack",
    description: "Unlock exclusive avatar customization options",
    pointsCost: 150,
    category: "Customization",
    image: "/placeholder.svg?height=100&width=100",
    available: true,
  },
  {
    id: "r5",
    name: "Dark Theme Pack",
    description: "Unlock premium dark theme customizations",
    pointsCost: 100,
    category: "Customization",
    image: "/placeholder.svg?height=100&width=100",
    available: true,
  },
  {
    id: "r6",
    name: "$5 Starbucks Gift Card",
    description: "Fuel your study sessions with some coffee",
    pointsCost: 450,
    category: "GiftCards",
    image: "/placeholder.svg?height=100&width=100",
    available: true,
  },
  {
    id: "r7",
    name: "Premium Course Access",
    description: "1-month access to premium courses",
    pointsCost: 800,
    category: "Educational",
    image: "/placeholder.svg?height=100&width=100",
    available: true,
  },
  {
    id: "r8",
    name: "Perfect Attendance Badge",
    description: "Recognition for your consistent study habits",
    pointsCost: 50,
    category: "Achievements",
    image: "/placeholder.svg?height=100&width=100",
    available: true,
  },
]

export function RewardDisplay() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [rewards, setRewards] = useState<Reward[]>(mockRewards)
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
  const [isRedeemDialogOpen, setIsRedeemDialogOpen] = useState(false)
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
  const [isRedeemSuccess, setIsRedeemSuccess] = useState(false)
  const [couponCode, setCouponCode] = useState("")

  // Filter rewards by category
  const giftCards = rewards.filter((r) => r.category === "GiftCards" && r.available)
  const educational = rewards.filter((r) => r.category === "Educational" && r.available)
  const customization = rewards.filter((r) => r.category === "Customization" && r.available)
  const achievements = rewards.filter((r) => r.category === "Achievements" && r.available)

  // Handle reward selection
  const handleSelectReward = (reward: Reward) => {
    setSelectedReward(reward)
    setIsRedeemDialogOpen(true)
  }

  // Handle reward redemption
  const handleRedeemReward = () => {
    setIsRedeemDialogOpen(false)
    setIsConfirmationOpen(true)
  }

  // Confirm redemption
  const confirmRedemption = () => {
    if (!selectedReward || !user) return

    // Generate random coupon code
    const randomCode = Math.random().toString(36).substring(2, 10).toUpperCase()
    setCouponCode(randomCode)

    // Show success dialog
    setIsConfirmationOpen(false)
    setIsRedeemSuccess(true)

    // Update user points (in a real app, this would be a server action)
    // Mock the points deduction
    toast({
      title: "Reward Redeemed!",
      description: `You've successfully redeemed ${selectedReward.name}`,
    })
  }

  // Reset all dialogs
  const resetDialogs = () => {
    setIsRedeemDialogOpen(false)
    setIsConfirmationOpen(false)
    setIsRedeemSuccess(false)
    setSelectedReward(null)
  }

  // Check if user can afford a reward
  const canAfford = (pointsCost: number) => {
    return user ? user.points >= pointsCost : false
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Rewards Marketplace</CardTitle>
              <CardDescription>Redeem your points for rewards and achievements</CardDescription>
            </div>
            <div className="flex items-center gap-2 pr-2">
              <Trophy className="h-5 w-5 text-amber-400" />
              <span className="text-lg font-bold">{user?.points || 0}</span>
              <span className="text-sm text-muted-foreground">points</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-0">
          <Tabs defaultValue="giftcards" className="space-y-4">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="giftcards">
                <CreditCard className="h-4 w-4 mr-2 hidden sm:block" />
                Gift Cards
              </TabsTrigger>
              <TabsTrigger value="educational">
                <BookOpen className="h-4 w-4 mr-2 hidden sm:block" />
                Educational
              </TabsTrigger>
              <TabsTrigger value="customization">
                <Paintbrush className="h-4 w-4 mr-2 hidden sm:block" />
                Customization
              </TabsTrigger>
              <TabsTrigger value="achievements">
                <Trophy className="h-4 w-4 mr-2 hidden sm:block" />
                Achievements
              </TabsTrigger>
            </TabsList>

            <TabsContent value="giftcards">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                {giftCards.map((reward) => (
                  <RewardCard
                    key={reward.id}
                    reward={reward}
                    canAfford={canAfford(reward.pointsCost)}
                    onSelect={() => handleSelectReward(reward)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="educational">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                {educational.map((reward) => (
                  <RewardCard
                    key={reward.id}
                    reward={reward}
                    canAfford={canAfford(reward.pointsCost)}
                    onSelect={() => handleSelectReward(reward)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="customization">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                {customization.map((reward) => (
                  <RewardCard
                    key={reward.id}
                    reward={reward}
                    canAfford={canAfford(reward.pointsCost)}
                    onSelect={() => handleSelectReward(reward)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="achievements">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                {achievements.map((reward) => (
                  <RewardCard
                    key={reward.id}
                    reward={reward}
                    canAfford={canAfford(reward.pointsCost)}
                    onSelect={() => handleSelectReward(reward)}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="pt-6">
          <div className="text-sm text-muted-foreground">
            Points are earned by completing tasks, quizzes, and maintaining study streaks.
          </div>
        </CardFooter>
      </Card>

      {/* Redeem Dialog */}
      <Dialog open={isRedeemDialogOpen} onOpenChange={setIsRedeemDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Redeem Reward</DialogTitle>
            <DialogDescription>Are you sure you want to redeem this reward?</DialogDescription>
          </DialogHeader>
          {selectedReward && (
            <div className="flex flex-col items-center py-4">
              <div className="h-24 w-24 bg-muted rounded-lg flex items-center justify-center mb-4">
                <img src={selectedReward.image || "/placeholder.svg"} alt={selectedReward.name} className="h-16 w-16" />
              </div>
              <h3 className="text-lg font-semibold">{selectedReward.name}</h3>
              <p className="text-sm text-center text-muted-foreground mt-1">{selectedReward.description}</p>
              <div className="flex items-center justify-center mt-4">
                <Badge variant="outline" className="text-amber-500">
                  <Trophy className="mr-1 h-4 w-4 text-amber-500" />
                  {selectedReward.pointsCost} points
                </Badge>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRedeemDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRedeemReward}>Confirm Redemption</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={isConfirmationOpen} onOpenChange={setIsConfirmationOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Redemption</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedReward && (
                <>
                  You are about to redeem {selectedReward.name} for <strong>{selectedReward.pointsCost} points</strong>.
                  This action cannot be undone and the points will be deducted from your account.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRedemption}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Dialog */}
      <Dialog open={isRedeemSuccess} onOpenChange={setIsRedeemSuccess}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Redemption Successful!
            </DialogTitle>
            <DialogDescription>Your reward has been successfully redeemed</DialogDescription>
          </DialogHeader>
          {selectedReward && (
            <div className="flex flex-col items-center py-4">
              <div className="h-24 w-24 bg-muted rounded-lg flex items-center justify-center mb-4">
                <img src={selectedReward.image || "/placeholder.svg"} alt={selectedReward.name} className="h-16 w-16" />
              </div>
              <h3 className="text-lg font-semibold">{selectedReward.name}</h3>
              {couponCode && (
                <div className="mt-4 p-3 bg-muted rounded-md w-full text-center">
                  <div className="text-xs text-muted-foreground mb-1">Your redemption code</div>
                  <div className="text-lg font-mono font-bold tracking-wider">{couponCode}</div>
                </div>
              )}
              <p className="text-sm text-center text-muted-foreground mt-4">
                {selectedReward.category === "GiftCards"
                  ? "Check your email for instructions on how to redeem your gift card."
                  : selectedReward.category === "Educational"
                    ? "Your premium content has been unlocked. Visit the content library to access it."
                    : selectedReward.category === "Customization"
                      ? "Your customization options have been unlocked. Visit your profile to apply them."
                      : "Your achievement has been added to your profile."}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={resetDialogs}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Reward Card Component
function RewardCard({
  reward,
  canAfford,
  onSelect,
}: {
  reward: Reward
  canAfford: boolean
  onSelect: () => void
}) {
  return (
    <Card className={!canAfford ? "opacity-60" : ""}>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base">{reward.name}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-center justify-center py-2 mb-2">
          <div className="h-20 w-20 bg-muted rounded-lg flex items-center justify-center">
            <img src={reward.image || "/placeholder.svg"} alt={reward.name} className="h-14 w-14" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{reward.description}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <Badge variant="outline">
          <Trophy className="mr-1 h-4 w-4 text-amber-400" />
          {reward.pointsCost} points
        </Badge>
        <Button size="sm" disabled={!canAfford} onClick={onSelect}>
          {canAfford ? "Redeem" : "Not Enough Points"}
        </Button>
      </CardFooter>
    </Card>
  )
}

